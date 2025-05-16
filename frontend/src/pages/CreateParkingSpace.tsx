import ParkingSpaceForm from '../components/ParkingSpaceForm';
import Navbar from '../components/Navbar';
import './CreateParkingSpace.css'

const CreateParkingSpace: React.FC = () => {
  return (
    <div>
      <Navbar backToDashboard />
      <div className="create-container">
      <h2 className="create-heading">Create a Parking Space</h2>
      <ParkingSpaceForm />
      </div>
    </div>
  );
};

export default CreateParkingSpace;
