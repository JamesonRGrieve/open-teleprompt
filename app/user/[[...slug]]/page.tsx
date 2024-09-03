import JRGAuthRouter from 'jrgcomponents/AuthRouter';
import { Google } from '@mui/icons-material';
export default function AuthRouter(props) {
  return (
    <JRGAuthRouter
      {...props}
      corePagesConfig={{
        identify: {
          path: '/',
          heading: 'Please Sign Into Google and Allow Access to Your Documents',
          props: {
            oAuthOverrides: {
              Google: {
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                scope: 'profile email https://www.googleapis.com/auth/drive.readonly',
                uri: 'https://accounts.google.com/o/oauth2/v2/auth',
                params: {
                  access_type: 'offline',
                },
                icon: <Google />,
              },
            },
          },
        },
      }}
    />
  );
}
