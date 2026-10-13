import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GeneratorDashboard } from './GeneratorDashboard';
import { CollectorDashboard } from './CollectorDashboard';
import { RecyclerDashboard } from './RecyclerDashboard';
import { AdminDashboard } from './AdminDashboard';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();

  switch (currentUser?.role) {
    case 'generator':
      return <GeneratorDashboard />;
    case 'collector':
      return <CollectorDashboard />;
    case 'recycler':
      return <RecyclerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <GeneratorDashboard />;
  }
};
