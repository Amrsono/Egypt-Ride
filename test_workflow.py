import urllib.request
import json
import sys
import io

# Set UTF-8 for console output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = 'http://localhost:5000/api'

def req(url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    bdata = json.dumps(data).encode('utf-8') if data else None
    r = urllib.request.Request(f'{BASE}{url}', data=bdata, headers=headers, method=method)
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("=== 1. DEMO USERS CHECK ===")
users = req('/auth/demo-users')
names = [u['name'] for u in users]
print(f"Found {len(users)} demo users: {names}")
assert any(u['email'] == 'admin@egyptride.com' for u in users), "Missing Admin"
assert any(u['email'] == 'user@egyptride.com' for u in users), "Missing User"
assert any(u['email'] == 'driver@egyptride.com' for u in users), "Missing Driver"
print("[OK] Seed accounts verified!")

print("\n=== 2. CUSTOMER LOGIN & TRIP BOOKING ===")
cust = req('/auth/login', 'POST', {'email': 'user@egyptride.com', 'password': 'user123'})
cust_token = cust['token']
print(f"[OK] Logged in as: {cust['user']['name']} ({cust['user']['email']})")

trip = req('/trips', 'POST', {
    'pickupAddress': 'Tahrir Square, Downtown Cairo',
    'pickupCoords': {'lat': 30.0444, 'lng': 31.2357},
    'destinationAddress': 'Citystars Mall, Nasr City',
    'destinationCoords': {'lat': 30.0735, 'lng': 31.3456},
    'distanceKm': 14.2,
    'notes': 'Waiting near metro entrance'
}, token=cust_token)
trip_id = trip['id']
print(f"[OK] Trip created: ID={trip_id}, Status={trip['status']}, Fare={trip['estimatedFare']} {trip['currency']}")

print("\n=== 3. DRIVER QUEUE & ACCEPTANCE ===")
d1 = req('/auth/login', 'POST', {'email': 'driver@egyptride.com', 'password': 'driver123'})
d1_token = d1['token']
queue = req('/trips/queue', token=d1_token)
print(f"[OK] Driver saw {len(queue)} trip(s) in queue")

accepted = req(f'/trips/{trip_id}/accept', 'POST', token=d1_token)
print(f"[OK] Driver accepted trip: Status={accepted['status']}, Driver={accepted['driverName']}")

print("\n=== 4. DRIVER FLAGS 'CUSTOMER PICKED UP' ===")
picked_up = req(f'/trips/{trip_id}/pickup', 'POST', token=d1_token)
print(f"[OK] Status updated to: {picked_up['status']} at {picked_up['pickedUpAt']}")

print("\n=== 5. DRIVER FLAGS 'CUSTOMER DROPPED OFF' & ENTERS AMOUNT PAID ===")
dropped_off = req(f'/trips/{trip_id}/dropoff', 'POST', {'amountPaid': 125}, token=d1_token)
print(f"[OK] Status updated to: {dropped_off['status']}, Final Amount Paid={dropped_off['finalFare']} {dropped_off['currency']}")

print("\n=== 6. CUSTOMER RATES TRIP ===")
rated = req(f'/trips/{trip_id}/rate', 'POST', {'rating': 5}, token=cust_token)
print(f"[OK] Customer rating submitted: {rated['customerRating']} Stars")

print("\n=== 7. OWNER / ADMIN REVENUE & FLEET ANALYTICS ===")
admin = req('/auth/login', 'POST', {'email': 'admin@egyptride.com', 'password': 'admin123'})
admin_metrics = req('/admin/metrics', token=admin['token'])
print(f"[OK] Total Trips: {admin_metrics['totalTrips']}")
print(f"[OK] Completed Trips: {admin_metrics['completedTrips']}")
print(f"[OK] Total Revenue: {admin_metrics['totalRevenue']} EGP")
print(f"[OK] Active Drivers: {admin_metrics['onlineDrivers']} / {admin_metrics['totalDrivers']}")

print("\n==========================================")
print("SUCCESS: ALL END-TO-END WORKFLOW TESTS PASSED!")
print("==========================================")
