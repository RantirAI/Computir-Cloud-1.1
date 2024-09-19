import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

const AuthenticatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const response = searchParams.get('response');

  useEffect(() => {
    if (response) {
      const decodedResponse = JSON.parse(atob(response));
      authenticationSession.saveResponse(decodedResponse);
      navigate('/flows');
    }
  }, [response]);

  return <>Please wait...</>;
};

export default AuthenticatePage;