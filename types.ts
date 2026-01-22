
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  name: string;
  position: string;
  department: string;
  password?: string;
  role: UserRole;
}

export enum AttendanceType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT'
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  type: AttendanceType;
  ip: string;
}

export interface NetworkConfig {
  whitelistedIps: string[];
}
