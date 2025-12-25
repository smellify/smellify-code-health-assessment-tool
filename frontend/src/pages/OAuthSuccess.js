//pages/OAuthSuccess.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const type = params.get('type'); // 'login' or 'signup'
        
        if (token) {
          // Store the token
          localStorage.setItem('token', token);
          
          // Verify the token is stored
          const storedToken = localStorage.getItem('token');
          if (storedToken === token) {
            console.log('Token successfully stored via GitHub OAuth');
            
            // Add a small delay to ensure storage is complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Navigate to dashboard
            if (type === 'signup') {
              navigate('/dashboard', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          } else {
            console.error('Token storage failed');
            navigate('/login?error=token_storage_failed', { replace: true });
          }
        } else {
          console.error('No token received from GitHub OAuth');
          navigate('/login?error=no_token', { replace: true });
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_failed', { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  if (isProcessing) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column' 
      }}>
        <div>Logging you in with GitHub...</div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Please wait while we complete your authentication.
        </div>
      </div>
    );
  }

  return null;
}