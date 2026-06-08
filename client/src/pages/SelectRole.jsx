import { useNavigate } from 'react-router-dom';
import RoleSelector from '../components/RoleSelector';

export default function SelectRole() {
  const navigate = useNavigate();

  function handleRoleSelected() {
    // Redirect to appropriate dashboard based on role
    navigate('/home');
  }

  return <RoleSelector onRoleSelected={handleRoleSelected} />;
}
