// Real Data Store Initial Definitions
// Initialized empty for real plant operational data entered by users

export const INITIAL_MACHINES = [];

export const INITIAL_TOOLS = [];

export const INITIAL_PRODUCTION = [];

export const INITIAL_USERS = [
  {
    id: 'USR-001',
    name: 'Admin User',
    empId: 'EMP-001',
    email: 'admin@inel.com',
    role: 'Administrator',
    department: 'Plant Operations',
    phone: '+91 98401 23456',
    status: 'Active',
    createdDate: new Date().toISOString().slice(0, 10),
    avatar: 'AD'
  }
];
