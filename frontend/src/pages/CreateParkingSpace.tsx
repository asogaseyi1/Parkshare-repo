import ParkingSpaceForm from '../components/ParkingSpaceForm';
import './CreateParkingSpace.css'

const CreateParkingSpace: React.FC = () => {
  return (
    <div className="create-container">
      <h2 className="create-heading">Create a Parking Space</h2>
      <ParkingSpaceForm />
    </div>
  );
};

export default CreateParkingSpace;
