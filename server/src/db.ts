import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { User, Trip, SystemSettings } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  trips: Trip[];
  settings: SystemSettings;
}

// Initial Production Seed Data
const getInitialSeed = (): DatabaseSchema => {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  return {
    settings: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      baseFare: 20, // base fare in EGP
      perKmRate: 6.5, // 6.5 EGP per KM
      currency: 'EGP',
      companyName: 'Nasr Ride',
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
    },
    users: [
      {
        id: 'user_admin',
        name: 'Egypt Ride Admin',
        email: 'admin@egyptride.com',
        password: hash('admin123'),
        role: 'admin',
        phone: '+20 100 000 0001',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_driver',
        name: 'Egypt Ride Driver',
        email: 'driver@egyptride.com',
        password: hash('driver123'),
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
        password: hash('user123'),
        role: 'customer',
        phone: '+20 100 123 4567',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        totalTrips: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    trips: [],
  };
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.settings) {
          this.data.settings = getInitialSeed().settings;
        }
      } catch (err) {
        console.error('Error reading db.json, re-seeding...', err);
        this.data = getInitialSeed();
        this.save();
      }
    } else {
      this.data = getInitialSeed();
      this.save();
    }
  }

  public resetToCleanSeed(): void {
    this.data = getInitialSeed();
    this.save();
  }

  public save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing db.json', err);
    }
  }

  // User Methods
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    this.save();
    return true;
  }

  // Trip Methods
  public getTrips(): Trip[] {
    return [...this.data.trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTripById(id: string): Trip | undefined {
    return this.data.trips.find((t) => t.id === id);
  }

  public createTrip(trip: Trip): Trip {
    this.data.trips.push(trip);
    this.save();
    return trip;
  }

  public updateTrip(id: string, updates: Partial<Trip>): Trip | undefined {
    const idx = this.data.trips.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.data.trips[idx] = { ...this.data.trips[idx], ...updates };
    this.save();
    return this.data.trips[idx];
  }

  // Settings
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }
}

export const db = new Database();
