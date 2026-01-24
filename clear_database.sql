-- Delete all data in correct order (respecting foreign keys)
DELETE FROM order_items;
DELETE FROM payments;
DELETE FROM orders;
DELETE FROM addresses;
DELETE FROM cart_items;
DELETE FROM wishlists;
DELETE FROM reviews;
DELETE FROM inventory_locks;
DELETE FROM password_resets;
DELETE FROM notifications;
DELETE FROM users;

-- Verify all deleted
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments;
