import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/Home';
import HomeLayout from './layouts/HomeLayout';
import SignIn from './components/SignIn';
import SignIn_LogIn from './layouts/SignIn_LogIn';
import LogIn from './components/LogIn';
import Details from './components/Details';
import Itinerary from './components/Itinerary';
import TripChatbot from './components/TripChatbot';
import ProfileLayout from './layouts/ProfileLayout';
import Display_Itineraries from './components/Display_Itineraries';

// import {LoadScript} from '@react-google-maps/api'
// const libraries = ['places'];

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <HomeLayout/>,
      children: [
        {
          index: true,
          element: <Home/>
        }
      ],
    },
    {
      path: '/signIn',
      element: <SignIn_LogIn/>,
      children: [
        {
          index: true, 
          element: <SignIn/>
        }, 
      ],
    },
    {
      path: '/logIn',
      element: <SignIn_LogIn/>,
      children: [
        {
          index: true, 
          element: <LogIn/>
        }, 
      ],
    },
    {
      path: '/dashboard',
      element: <ProfileLayout/>,
      children: [
        {
          index: true,
          element: <Display_Itineraries/>
        }, 
        {
          path: 'details',
          element: <Details/>
        },
        {
          path: 'chat',
          element: <TripChatbot/>
        }
      ]
    },
    {
      path: '/itinerary/:id?',
      element: <Itinerary/>,
    }
    // Itinerary and Dashboard Remaining..
  ])
  return (
      <RouterProvider router={router} />
  )
}

export default App
