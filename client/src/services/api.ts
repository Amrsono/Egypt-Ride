import { User, Trip, SystemSettings, AdminMetrics, DriverWithStats } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('nasr_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------
// LOCAL CLIENT DATABASE (Fallback for Static Vercel Hosting)
// -------------------------------------------------------------
interface LocalDB {
  users: User[];
  trips: Trip[];
  settings: SystemSettings;
}

const DEFAULT_USERS: User[] = [
  {
    id: 'user_admin',
    name: 'Egypt Ride Admin',
    email: 'admin@egyptride.com',
    role: 'admin',
    phone: '+20 100 000 0001',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_driver',
    name: 'Egypt Ride Driver',
    email: 'driver@egyptride.com',
    role: 'driver',
    phone: '+20 101 111 2221',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    carDetails: {
      model: 'Toyota Corolla (2022)',
      plate: '7777 VIP',
      color: 'White',
    },
    isOnline: true,
    currentLocation: { lat: 30.0444, lng: 31.2357 },
    totalTrips: 0,
    totalEarnings: 0,
    rating: 5.0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_customer',
    name: 'Egypt Ride User',
    email: 'user@egyptride.com',
    role: 'customer',
    phone: '+20 100 123 4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    totalTrips: 0,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_SETTINGS: SystemSettings = {
  googleMapsApiKey: '',
  baseFare: 20,
  perKmRate: 6.5,
  currency: 'EGP',
  companyName: 'Egypt Ride',
  fixedRoutes: [
    {
      id: 'route_1',
      pickupName: 'Cairo Airport Terminal 3',
      destinationName: 'Giza Pyramids & Great Sphinx',
      price: 350,
      isActive: true,
      isBidirectional: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'route_2',
      pickupName: 'Cairo Airport Terminal 3',
      destinationName: 'The Grand Egyptian Museum (GEM)',
      price: 320,
      isActive: true,
      isBidirectional: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'route_3',
      pickupName: 'Cairo Airport Terminal 3',
      destinationName: 'The Egyptian Museum (Tahrir Square)',
      price: 220,
      isActive: true,
      isBidirectional: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'route_4',
      pickupName: 'Cairo Airport Terminal 3',
      destinationName: 'Khan el-Khalili & Islamic Cairo',
      price: 240,
      isActive: true,
      isBidirectional: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'route_5',
      pickupName: 'Cairo Airport Terminal 3',
      destinationName: 'Cairo Citadel & Mohamed Ali Mosque',
      price: 250,
      isActive: true,
      isBidirectional: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'route_6',
      pickupName: 'Cairo Airport Terminal 3',
      destinationName: 'Zamalek & Nile River Corniche',
      price: 200,
      isActive: true,
      isBidirectional: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'route_7',
      pickupName: 'Cairo Airport Terminal 3',
      destinationName: 'New Administrative Capital (Iconic Tower)',
      price: 450,
      isActive: true,
      isBidirectional: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'route_8',
      pickupName: 'Sphinx International Airport (SPX)',
      destinationName: 'Giza Pyramids & Great Sphinx',
      price: 180,
      isActive: true,
      isBidirectional: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'route_9',
      pickupName: 'Sphinx International Airport (SPX)',
      destinationName: 'The Grand Egyptian Museum (GEM)',
      price: 190,
      isActive: true,
      isBidirectional: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'route_10',
      pickupName: 'Cairo Airport Terminal 3',
      destinationName: 'Alexandria Library & Qaitbay Citadel',
      price: 1800,
      isActive: true,
      isBidirectional: true,
      createdAt: new Date().toISOString(),
    },
  ],
};

function getLocalDB(): LocalDB {
  const raw = localStorage.getItem('nasr_local_db');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  const initial: LocalDB = {
    users: DEFAULT_USERS,
    trips: [],
    settings: DEFAULT_SETTINGS,
  };
  localStorage.setItem('nasr_local_db', JSON.stringify(initial));
  return initial;
}

function saveLocalDB(db: LocalDB) {
  localStorage.setItem('nasr_local_db', JSON.stringify(db));
  window.dispatchEvent(new CustomEvent('nasr:db_updated'));
}

function getCurrentUserId(): string | null {
  const token = localStorage.getItem('nasr_token');
  if (!token) return null;
  return localStorage.getItem('nasr_user_id') || 'user_admin';
}

// -------------------------------------------------------------
// UNIVERSAL API CLIENT
// -------------------------------------------------------------
export const api = {
  async getDemoUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-users`);
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}
    return getLocalDB().users;
  },

  async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: password || 'admin123' }),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        const data = await res.json();
        localStorage.setItem('nasr_user_id', data.user.id);
        return data;
      }
    } catch {}

    // Fallback: Local Authentication
    const db = getLocalDB();
    const cleanDigits = cleanEmail.replace(/[^0-9]/g, '');
    let user = db.users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.name.toLowerCase() === cleanEmail ||
        (cleanDigits && u.phone && u.phone.replace(/[^0-9]/g, '') === cleanDigits)
    );
    if (!user) {
      if (cleanEmail === 'admin@egyptride.com') {
        user = DEFAULT_USERS[0];
      } else if (cleanEmail.startsWith('driver')) {
        user = DEFAULT_USERS[1];
      } else if (cleanEmail === 'user@egyptride.com') {
        user = DEFAULT_USERS[2];
      } else {
        user = {
          id: `user_${Date.now()}`,
          name: cleanEmail.split('@')[0],
          email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@egyptride.com`,
          role: 'customer',
          phone: cleanDigits || '+20 100 000 0000',
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        saveLocalDB(db);
      }
    }

    const token = `token_${user.id}_${Date.now()}`;
    localStorage.setItem('nasr_user_id', user.id);
    return { user, token };
  },

  async register(data: any): Promise<{ user: User; token: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        const resData = await res.json();
        localStorage.setItem('nasr_user_id', resData.user.id);
        return resData;
      }
    } catch {}

    // Fallback: Local Registration
    const db = getLocalDB();
    const cleanDigits = (data.phone || '').replace(/[^0-9]/g, '');
    const cleanEmail = (
      data.email ||
      (cleanDigits ? `${cleanDigits}@egyptride.com` : `${(data.name || 'user').replace(/\s+/g, '').toLowerCase()}@egyptride.com`)
    ).trim().toLowerCase();

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: data.name || 'User',
      email: cleanEmail,
      role: data.role || 'customer',
      phone: data.phone || '',
      avatar: data.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80`,
      carDetails: data.carDetails,
      isOnline: data.role === 'driver',
      totalTrips: 0,
      totalEarnings: 0,
      rating: 5.0,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveLocalDB(db);

    const token = `token_${newUser.id}_${Date.now()}`;
    localStorage.setItem('nasr_user_id', newUser.id);
    return { user: newUser, token };
  },

  async getMe(): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const uid = getCurrentUserId();
    const db = getLocalDB();
    const user = db.users.find((u) => u.id === uid) || db.users[0];
    return user;
  },

  async updateMe(data: Partial<User>): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const uid = getCurrentUserId();
    const db = getLocalDB();
    const idx = db.users.findIndex((u) => u.id === uid);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...data };
      saveLocalDB(db);
      return db.users[idx];
    }
    return db.users[0];
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
      const data = await res.json().catch(() => ({}));
      if (data.error) throw new Error(data.error);
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) throw err;
    }

    // Fallback: Local DB
    const uid = getCurrentUserId();
    const db = getLocalDB();
    const user = db.users.find((u) => u.id === uid);
    if (!user) throw new Error('User not found');
    user.password = newPassword;
    saveLocalDB(db);
    return { message: 'Password updated successfully' };
  },

  // Trips
  async getTrips(): Promise<Trip[]> {
    try {
      const res = await fetch(`${API_BASE}/trips`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    return getLocalDB().trips;
  },

  async getDriverQueue(): Promise<Trip[]> {
    try {
      const res = await fetch(`${API_BASE}/trips/queue`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    return db.trips.filter((t) => t.status === 'REQUESTED');
  },

  async getActiveTrip(): Promise<Trip | null> {
    try {
      const res = await fetch(`${API_BASE}/trips/active`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const uid = getCurrentUserId();
    const db = getLocalDB();
    const active = db.trips.find(
      (t) => (t.customerId === uid || t.driverId === uid) && ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'PICKED_UP'].includes(t.status)
    );
    return active || null;
  },

  async createTrip(data: {
    pickupAddress: string;
    pickupCoords: { lat: number; lng: number };
    destinationAddress: string;
    destinationCoords: { lat: number; lng: number };
    distanceKm: number;
    notes?: string;
  }): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const uid = getCurrentUserId();
    const db = getLocalDB();
    const user = db.users.find((u) => u.id === uid) || db.users[5];
    const settings = db.settings;
    const dist = data.distanceKm || 5.0;
    const estFare = Math.round(settings.baseFare + dist * settings.perKmRate);

    const newTrip: Trip = {
      id: `trip_${Date.now().toString(36)}`,
      customerId: user.id,
      customerName: user.name,
      customerPhone: user.phone || '+20 100 123 4567',
      driverId: null,
      driverName: null,
      driverPhone: null,
      driverCar: null,
      pickupAddress: data.pickupAddress,
      pickupCoords: data.pickupCoords,
      destinationAddress: data.destinationAddress,
      destinationCoords: data.destinationCoords,
      distanceKm: dist,
      estimatedFare: estFare,
      finalFare: null,
      currency: settings.currency,
      status: 'REQUESTED',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      arrivedAt: null,
      pickedUpAt: null,
      droppedOffAt: null,
      cancelledAt: null,
      customerRating: null,
    };

    db.trips.unshift(newTrip);
    saveLocalDB(db);
    return newTrip;
  },

  async acceptTrip(tripId: string): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/accept`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const uid = getCurrentUserId();
    const db = getLocalDB();
    const driver = db.users.find((u) => u.id === uid) || db.users[1];
    const idx = db.trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    db.trips[idx] = {
      ...db.trips[idx],
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverCar: driver.carDetails ? `${driver.carDetails.model} - ${driver.carDetails.plate}` : 'Toyota Corolla',
      status: 'ACCEPTED',
      acceptedAt: new Date().toISOString(),
    };
    saveLocalDB(db);
    return db.trips[idx];
  },

  async arriveAtPickup(tripId: string): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/arrive`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const idx = db.trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    db.trips[idx] = {
      ...db.trips[idx],
      status: 'ARRIVED',
      arrivedAt: new Date().toISOString(),
    };
    saveLocalDB(db);
    return db.trips[idx];
  },

  async pickupCustomer(tripId: string): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/pickup`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const idx = db.trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    db.trips[idx] = {
      ...db.trips[idx],
      status: 'PICKED_UP',
      pickedUpAt: new Date().toISOString(),
    };
    saveLocalDB(db);
    return db.trips[idx];
  },

  async dropoffCustomer(tripId: string, amountPaid: number): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/dropoff`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amountPaid }),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const idx = db.trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    const trip = db.trips[idx];
    const finalAmount = amountPaid || trip.estimatedFare;

    db.trips[idx] = {
      ...trip,
      status: 'DROPPED_OFF',
      finalFare: finalAmount,
      droppedOffAt: new Date().toISOString(),
    };

    // Update driver earnings
    if (trip.driverId) {
      const dIdx = db.users.findIndex((u) => u.id === trip.driverId);
      if (dIdx !== -1) {
        db.users[dIdx].totalTrips = (db.users[dIdx].totalTrips || 0) + 1;
        db.users[dIdx].totalEarnings = (db.users[dIdx].totalEarnings || 0) + finalAmount;
      }
    }

    saveLocalDB(db);
    return db.trips[idx];
  },

  async cancelTrip(tripId: string): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/cancel`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const idx = db.trips.findIndex((t) => t.id === tripId);
    if (idx === -1) {
      const newLocalTrip: Trip = {
        id: tripId,
        customerId: getCurrentUserId(),
        customerName: 'Egypt Ride User',
        customerPhone: '+20 100 123 4567',
        driverId: null,
        driverName: null,
        driverPhone: null,
        driverCar: null,
        pickupAddress: 'Cairo Airport Terminal 3',
        pickupCoords: { lat: 30.1219, lng: 31.4056 },
        destinationAddress: 'Giza Pyramids & Great Sphinx',
        destinationCoords: { lat: 29.9792, lng: 31.1342 },
        distanceKm: 15.0,
        estimatedFare: 350,
        finalFare: null,
        currency: 'EGP',
        status: 'ACCEPTED',
        createdAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
        arrivedAt: null,
        pickedUpAt: null,
        droppedOffAt: null,
        cancelledAt: null,
        customerRating: null,
      };
      db.trips.unshift(newLocalTrip);
      saveLocalDB(db);
      return {
        ...newLocalTrip,
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
      };
    }

    db.trips[idx] = {
      ...db.trips[idx],
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
    };
    saveLocalDB(db);
    return db.trips[idx];
  },

  async rateTrip(tripId: string, rating: number): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/rate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rating }),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const idx = db.trips.findIndex((t) => t.id === tripId);
    if (idx === -1) throw new Error('Trip not found');

    db.trips[idx] = {
      ...db.trips[idx],
      customerRating: rating,
    };
    saveLocalDB(db);
    return db.trips[idx];
  },

  // Admin
  async getAdminMetrics(): Promise<AdminMetrics> {
    try {
      const res = await fetch(`${API_BASE}/admin/metrics`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const completed = db.trips.filter((t) => t.status === 'DROPPED_OFF');
    const active = db.trips.filter((t) => ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'PICKED_UP'].includes(t.status));
    const revenue = completed.reduce((sum, t) => sum + (t.finalFare || t.estimatedFare || 0), 0);
    const distance = completed.reduce((sum, t) => sum + (t.distanceKm || 0), 0);

    return {
      totalRevenue: revenue,
      totalTrips: completed.length + active.length,
      completedTrips: completed.length,
      activeTrips: active.length,
      cancelledTrips: db.trips.filter((t) => t.status === 'CANCELLED').length,
      avgTripCost: completed.length > 0 ? Math.round(revenue / completed.length) : 0,
      totalDistance: distance,
      totalDrivers: db.users.filter((u) => u.role === 'driver').length,
      onlineDrivers: db.users.filter((u) => u.role === 'driver' && u.isOnline).length,
      totalCustomers: db.users.filter((u) => u.role === 'customer').length,
      last7Days: [],
    };
  },

  async getAdminDrivers(): Promise<DriverWithStats[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/drivers`, {
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const drivers = db.users.filter((u) => u.role === 'driver');
    return drivers.map((d) => ({
      ...d,
      completedTripsCount: d.totalTrips || 0,
      totalEarned: d.totalEarnings || 0,
      activeTrip: db.trips.find((t) => t.driverId === d.id && ['ACCEPTED', 'ARRIVED', 'PICKED_UP'].includes(t.status)) || null,
    }));
  },

  async createDriver(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    avatar?: string;
    carDetails?: { model: string; plate: string; color: string };
    isOnline?: boolean;
  }): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/admin/drivers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const existing = db.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) throw new Error('A user with this email already exists');

    const newDriver: User = {
      id: `user_driver_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: 'driver',
      phone: data.phone?.trim() || '+20 100 000 0000',
      avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name.trim())}`,
      carDetails: {
        model: data.carDetails?.model?.trim() || 'Toyota Corolla',
        plate: data.carDetails?.plate?.trim() || '1234 ABC',
        color: data.carDetails?.color?.trim() || 'White',
      },
      isOnline: data.isOnline !== undefined ? data.isOnline : true,
      currentLocation: { lat: 30.0444, lng: 31.2357 },
      totalTrips: 0,
      totalEarnings: 0,
      rating: 5.0,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newDriver);
    saveLocalDB(db);
    return newDriver;
  },

  async updateDriver(
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      avatar?: string;
      carDetails?: { model: string; plate: string; color: string };
      isOnline?: boolean;
    }
  ): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/admin/drivers/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Driver not found');

    db.users[idx] = {
      ...db.users[idx],
      ...(data.name && { name: data.name.trim() }),
      ...(data.email && { email: data.email.trim().toLowerCase() }),
      ...(data.phone !== undefined && { phone: data.phone.trim() }),
      ...(data.avatar !== undefined && { avatar: data.avatar.trim() }),
      ...(data.isOnline !== undefined && { isOnline: data.isOnline }),
      ...(data.carDetails && {
        carDetails: {
          model: data.carDetails.model?.trim() || db.users[idx].carDetails?.model || 'Sedan',
          plate: data.carDetails.plate?.trim() || db.users[idx].carDetails?.plate || '1234 ABC',
          color: data.carDetails.color?.trim() || db.users[idx].carDetails?.color || 'White',
        },
      }),
    };

    saveLocalDB(db);
    return db.users[idx];
  },

  async deleteDriver(id: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/admin/drivers/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      db.users.splice(idx, 1);
      saveLocalDB(db);
    }
    return { success: true };
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    return getLocalDB().settings;
  },

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        return res.json();
      }
    } catch {}

    const db = getLocalDB();
    db.settings = { ...db.settings, ...data };
    saveLocalDB(db);
    return db.settings;
  },
};
