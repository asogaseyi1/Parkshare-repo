import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import Navbar from '../components/Navbar';
import './ReservationPage.css'

const cardStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      '::placeholder': {
        color: '#a0aec0',
      },
    },
    invalid: {
      color: '#fa755a',
    },
  },
};

const ReservationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  console.log("ReservePage:id =", id);
  const navigate = useNavigate();
  const [space, setSpace] = useState<any>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('user@example.com'); // Replace with real user session

  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    api.get(`/api/parking-spaces/${id}`)
      .then(res => setSpace(res.data))
      .catch(err => console.error(err));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!stripe || !elements) {
      setError('Stripe is not loaded');
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (stripeError || !paymentMethod) {
      setError(stripeError?.message || 'Payment method creation failed');
      setLoading(false);
      return;
    }

    const payload = {
      userEmail,
      parkingSpaceId: id,
      startTime,
      endTime,
      paymentMethodId: paymentMethod.id,
    };

    try {
      await api.post('/reservations/create', payload);
      alert('Reservation created!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Reservation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!space) return <p>Loading reservation data...</p>;

  return (
    <div className="reservation-page">
      <Navbar backToDashboard />
      <h2>Reserve Parking Space</h2>
      <p><strong>Title:</strong> {space.title}</p>
      <p><strong>Description:</strong> {space.description}</p>
      <p><strong>Price:</strong> ${space.pricePerHour}/hr</p>

      <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
        <label>
          Start Time:
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </label>
        <label>
          End Time:
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </label>

        <label>
          Payment Details:
          <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <CardElement options={cardStyle} />
          </div>
        </label>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={!stripe || loading}>
          {loading ? 'Processing...' : 'Confirm Reservation'}
        </button>
      </form>
    </div>
  );
};

export default ReservationPage;
