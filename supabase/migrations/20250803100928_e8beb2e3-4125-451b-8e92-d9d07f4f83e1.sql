-- Temporarily disable role escalation trigger to update user role
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON profiles;

-- Update user role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'c2080fb5-8674-4a49-a5fc-5003e24b638b';

-- Re-enable the role escalation trigger
CREATE TRIGGER prevent_role_escalation_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_escalation();