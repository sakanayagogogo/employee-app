// src/types/index.ts
export type UserRole = 'GENERAL' | 'STORE_ADMIN' | 'HQ_ADMIN';
// Union role and employment type use numeric string codes from master_data table
export type UnionRole = string;
export type EmploymentType = string;
export type ImportanceLevel = 'NORMAL' | 'IMPORTANT';
export type TargetType = 'ALL' | 'STORE' | 'STORE_GROUP' | 'EMPLOYMENT_TYPE' | 'UNION_ROLE' | 'USER';
export type InquiryDestination = 'STORE' | 'HEADQUARTERS';
export type InquiryCategory = '労務' | '業務' | '教育' | '人間関係' | '設備' | 'その他';
export type InquiryStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type WidgetType = 'SURVEY' | 'ATTENDANCE' | 'CHECKLIST' | 'LINK' | 'BOARD';
export type WidgetSize = 'S' | 'M' | 'L';

export interface JWTPayload {
  sub: string; // user id as string
  employeeNumber: string;
  name: string;
  role: UserRole;
  storeId: number | null;
  groupId: number | null;
  employmentType: EmploymentType;
  unionRole?: UnionRole;
  jobTitle?: string | null;
  iat?: number;
  exp?: number;
}

export interface User {
  id: number;
  employeeNumber: string;
  name: string;
  email: string | null;
  role: UserRole;
  storeId: number | null;
  storeName?: string;
  employmentType: EmploymentType;
  unionRole: UnionRole;
  unionRoleBranch?: string | null;
  jobTitle: string | null;
  birthday: string | null;
  isActive: boolean;
  mustChangePw: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: number;
  name: string;
  code: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  importance: ImportanceLevel;
  startAt: string | null;
  endAt: string | null;
  isPublished: boolean;
  authorId: number;
  authorName?: string;
  isRead?: boolean;
  targets?: AnnouncementTarget[];
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementTarget {
  id: number;
  announcementId: number;
  targetType: TargetType;
  targetValue: string | null;
}

export interface Inquiry {
  id: number;
  title: string;
  destination: InquiryDestination;
  category: InquiryCategory;
  status: InquiryStatus;
  authorId: number;
  authorName?: string;
  storeId: number | null;
  storeName?: string;
  assigneeId: number | null;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
  messages?: InquiryMessage[];
}

export interface InquiryMessage {
  id: number;
  inquiryId: number;
  authorId: number;
  authorName: string;
  authorRole: UserRole;
  body: string;
  createdAt: string;
}

export interface PortalWidget {
  id: number;
  storeId: number | null;
  type: WidgetType;
  title: string;
  configJson: Record<string, unknown>;
  size: WidgetSize;
  sortOrder: number;
  isPublished: boolean;
  expiresAt: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  userResponse?: Record<string, unknown> | null;
}

export interface WidgetResponse {
  id: number;
  widgetId: number;
  userId: number;
  responseJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Survey widget config
export interface SurveyConfig {
  type: 'single_choice' | 'multiple_choice' | 'text';
  question: string;
  options?: string[];
  expiresAt?: string;
}

// Attendance widget config
export interface AttendanceConfig {
  eventName: string;
  eventDate?: string;
  deadline?: string;
}

// Checklist widget config
export interface ChecklistConfig {
  items: { id: string; label: string }[];
}

// Link widget config
export interface LinkConfig {
  url: string;
  description?: string;
}

// Board widget config
export interface BoardConfig {
  allowPost: boolean;
  description?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
