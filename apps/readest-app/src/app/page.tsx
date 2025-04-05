import { redirect } from 'next/navigation';

const HomePage = () => {
  redirect('/auth');
};

export default HomePage;
