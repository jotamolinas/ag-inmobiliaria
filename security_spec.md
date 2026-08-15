# Security Specification: AG Servicios Inmobiliarios Properties Collection

## 1. Data Invariants
- **Public Read Access**: Any client can query or read properties that are in `status == "published"`.
- **Private Admin Access**: Custom admin panel CRUD operations are restricted strictly to verified administrator accounts.
- **Admin Bootstrapping**: The user email `jotamolinas@gmail.com` is bootstrapped as the super administrator.
- **Timestamp Integrity**: `createdAt` is immutable and validated against `request.time`.
- **ID Safety**: Document IDs must be alphanumeric strings up to 128 characters to prevent injection attacks.

## 2. The Dirty Dozen Payloads (Rejection Targets)
1. **Unauthenticated Creation**: Creating a property without being signed in.
2. **Standard User Spoof**: Creating a property with a client account other than `jotamolinas@gmail.com`.
3. **Invalid ID string**: Creating a property with an ID of 1000 arbitrary characters.
4. **Missing Required Fields**: Creating without `priceRaw`, `location`, `partnerPhone` or `category`.
5. **Wrong DataType**: Setting `priceRaw` to a string instead of an integer.
6. **Negative Value**: Setting `priceRaw` or `commissionPercent` to negative values.
7. **Status Injection**: Attempting to set an invalid status outside of "pending" or "published".
8. **Malicious Giant String**: Injecting a 2MB base64 string directly into the text fields.
9. **Fake Verification**: Logging in with email `jotamolinas@gmail.com` but with `email_verified == false`.
10. **Immutable Alteration**: Attempting to alter `id` or `createdAt` fields on an update.
11. **Malicious Array Bloating**: Submitting a list of `amenities` with millions of trailing elements.
12. **Self-Elevated Admin**: Bypassing roles through client-side claims.

---

## 3. Firestore Rules (`firestore.rules`)
Below we will declare the robust rules using the exact global patterns specified.
