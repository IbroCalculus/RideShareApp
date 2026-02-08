-- Enable PostGIS Extension
create extension if not exists postgis;

-- Create Profiles Table (Linked to Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  phone text unique,
  role text check (role in ('rider', 'driver')) not null,
  car_model text, -- Nullable for riders
  car_plate text, -- Nullable for riders
  rating numeric default 5.0,
  is_online boolean default false, -- For drivers
  current_location geography(point), -- For drivers
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." 
  on public.profiles for select using (true);

create policy "Users can insert their own profile." 
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile." 
  on public.profiles for update using (auth.uid() = id);

-- Create Ride Status Enum
create type ride_status as enum (
  'requested', 
  'bidding', 
  'booked', 
  'in_progress', 
  'completed', 
  'cancelled'
);

-- Create Rides Table
create table public.rides (
  id uuid default uuid_generate_v4() primary key,
  rider_id uuid references public.profiles(id) not null,
  driver_id uuid references public.profiles(id), -- Null initially
  pickup_location geography(point) not null,
  dropoff_location geography(point) not null,
  pickup_address text not null,
  dropoff_address text not null,
  distance_meters numeric,
  estimated_duration_seconds numeric,
  status ride_status default 'requested'::ride_status,
  price numeric, -- Final agreed price
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Enable RLS for Rides
alter table public.rides enable row level security;

create policy "Riders can see their own rides." 
  on public.rides for select using (auth.uid() = rider_id);

create policy "Drivers can see requested rides within 5km." 
  on public.rides for select using (
    (select role from public.profiles where id = auth.uid()) = 'driver' 
    and status = 'requested'
    and ST_DWithin(pickup_location, (select current_location from public.profiles where id = auth.uid()), 5000)
  );

create policy "Riders can insert rides." 
  on public.rides for insert with check (auth.uid() = rider_id);

create policy "Drivers can update rides they accepted." 
  on public.rides for update using (auth.uid() = driver_id);


-- Create Bids Table
create table public.bids (
  id uuid default uuid_generate_v4() primary key,
  ride_id uuid references public.rides(id) not null,
  driver_id uuid references public.profiles(id) not null,
  amount numeric not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Bids
alter table public.bids enable row level security;

create policy "Riders can see bids for their active rides." 
  on public.bids for select using (
    exists (select 1 from public.rides where id = public.bids.ride_id and rider_id = auth.uid())
  );

create policy "Drivers can see their own bids." 
  on public.bids for select using (auth.uid() = driver_id);

create policy "Drivers can insert bids." 
  on public.bids for insert with check (auth.uid() = driver_id);


-- Functions for Realtime

-- Function to handle ride updates (optional, for triggers)
create or replace function public.handle_ride_update() 
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_ride_updated
  before update on public.rides
  for each row execute procedure public.handle_ride_update();

-- Add tables to realtime publication
alter publication supabase_realtime add table public.rides, public.bids;
