# security_spec.md - Edge Mart Security Rules Specification

## 1. Data Invariants
- **Profile Integrity**: Users cannot set their own role. Default profile registration must assign `role: "user"`. Only existing administrators can promote or execute writes on the `products` and `categories` catalogs.
- **Budget Lock**: Orders cannot be checked out if the cart total exceeds the category's remaining budget.
- **Audit Immutability**: Order `userId`, `totalAmount`, `categoryBreakdown`, and `createdAt` are fully immutable once compiled and saved. No modifications are allowed on existing orders.
- **Product Boundaries**: Product prices must be positive non-zero quantities. Product name sizes must not exceed reasonable length limits.

---

## 2. The "Dirty Dozen" Malicious Payloads
These payloads attempt to bypass normal authentication and database security rules. Our rules will block them completely.

1. **Self-Appointed Admin profile creation** (Injecting `"role": "admin"` during user signup).
2. **Post-registration Role Escalation** (Updating existing user profile's `"role"` from `"user"` to `"admin"`).
3. **Impersonating another User's Profile** (Creating or writing to `users/attacker_uid` as actual user ID `victim_uid`).
4. **Anonymously modifying or creating products** (Writing to `products/chicken_breast` without signature or as non-admin).
5. **Tampering with existing products price to $0** (Updating high-value products to lower price to checkout cheaply).
6. **Writing arbitrary negative stock to empty inventory**.
7. **Unauthorized order read** (User reading another user's private order receipts).
8. **Forging Order identity** (User creating an order document where `userId` is set to someone else's ID `victim_uid`).
9. **Post-order revision** (Updating or deleting a finalized purchase order `orders/xyz` to hide spending).
10. **Toxicity injection** (Injecting 1MB of text into product descriptions).
11. **Spoofed Admin login** (Trying to bypassing rules by passing unverified credentials).
12. **Budget tampering** (Bypassing remaining budget limit by directly updating `categories/dairy-eggs`spent field to negative numbers).

---

## 3. Threat Matrix & Validation Policy
The firestore rules defined in `firestore.rules` will explicitly block all 12 threats using secure helper gates:
- `isSignedIn()`: authenticates Firebase request state.
- `idValidId()`: sanitizes route identifiers.
- `isValidUser()`, `isValidProduct()`, `isValidOrder()`, `isValidCategory()`: schemas verifying types, value boundaries, name limits, and structures.
- Strict `affectedKeys().hasOnly()` actions dividing updates into distinct atomic tracks.
