import JRGAuthRouter from 'jrgcomponents/AuthRouter';
export default function AuthRouter(props) {
  return (
    <JRGAuthRouter
      {...props}
      corePagesConfig={{
        identify: {
          path: '/',
          heading: 'Please Sign Into Google and Allow Access to Your Documents',
        },
      }}
    />
  );
}
