import type { ReactNode, ComponentProps } from 'react';

// Base component types
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

// Button component types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Input component types
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends BaseComponentProps {
  type?: InputType;
  size?: InputSize;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

// Card component types
export type CardVariant = 'default' | 'bordered' | 'elevated' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends BaseComponentProps {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

// Modal/Dialog types
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  maskClosable?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

// Form types
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface SelectProps extends FormFieldProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  loading?: boolean;
  onChange?: (value: string | string[]) => void;
}

// Checkbox and Radio types
export interface CheckboxProps extends FormFieldProps {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  value?: string;
  onChange?: (checked: boolean) => void;
}

export interface RadioProps extends FormFieldProps {
  value: string;
  name: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (value: string) => void;
}

export interface RadioGroupProps extends FormFieldProps {
  name: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  orientation?: 'horizontal' | 'vertical';
  onChange?: (value: string) => void;
}

// Toast/Notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export interface ToastProps {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  closable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  toasts: ToastProps[];
  showToast: (toast: Omit<ToastProps, 'id'>) => string;
  hideToast: (id: string) => void;
  clearToasts: () => void;
}

// Loading states
export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  text?: string;
}

// Empty states
export interface EmptyStateProps extends BaseComponentProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Table types
export interface TableColumn<T = unknown> {
  key: string;
  title: string;
  dataIndex?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, record: T, index: number) => ReactNode;
}

export interface TableProps<T = unknown> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowSelection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
  };
  expandable?: {
    expandedRowRender: (record: T, index: number) => ReactNode;
    expandedRowKeys?: string[];
    onExpand?: (expanded: boolean, record: T) => void;
  };
}

// Tabs types
export interface TabItem {
  key: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  closable?: boolean;
  icon?: ReactNode;
}

export interface TabsProps extends BaseComponentProps {
  items: TabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  type?: 'line' | 'card' | 'editable-card';
  size?: 'sm' | 'md' | 'lg';
  onChange?: (activeKey: string) => void;
  onEdit?: (targetKey: string, action: 'add' | 'remove') => void;
}

// Avatar types
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  name?: string; // For generating initials
  online?: boolean;
  badge?: ReactNode;
}

// Badge types
export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends BaseComponentProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  count?: number;
  dot?: boolean;
  showZero?: boolean;
  max?: number;
  offset?: [number, number];
}

// Pagination types
export interface PaginationProps extends BaseComponentProps {
  current: number;
  total: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => ReactNode;
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
}

// Dropdown/Menu types
export interface MenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  children?: MenuItem[];
  onClick?: () => void;
}

export interface DropdownProps extends BaseComponentProps {
  items: MenuItem[];
  trigger?: 'click' | 'hover';
  placement?: 'bottomLeft' | 'bottomCenter' | 'bottomRight' | 'topLeft' | 'topCenter' | 'topRight';
  disabled?: boolean;
  arrow?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}

// Breadcrumb types
export interface BreadcrumbItem {
  title: ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

// Layout types
export interface LayoutProps extends BaseComponentProps {
  hasSider?: boolean;
}

export interface SiderProps extends BaseComponentProps {
  collapsed?: boolean;
  collapsible?: boolean;
  width?: number | string;
  collapsedWidth?: number;
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  onCollapse?: (collapsed: boolean, type: 'clickTrigger' | 'responsive') => void;
  onBreakpoint?: (broken: boolean) => void;
}

export interface HeaderProps extends BaseComponentProps {
  style?: React.CSSProperties;
}

export interface ContentProps extends BaseComponentProps {
  style?: React.CSSProperties;
}

export interface FooterProps extends BaseComponentProps {
  style?: React.CSSProperties;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
}

export interface ThemeConfig {
  colors: ThemeColors;
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
}

// Responsive types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

// Animation types
export type AnimationType = 'fadeIn' | 'slideIn' | 'slideOut' | 'scaleIn' | 'scaleOut';

export interface AnimationProps {
  type?: AnimationType;
  duration?: number;
  delay?: number;
  easing?: string;
}