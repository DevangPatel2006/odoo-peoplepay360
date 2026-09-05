import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Inbox,
  Loader2
} from 'lucide-react';
export { Toast, ToastContainer } from './Toast';

/* --------------------------------------------------------------------------
   1. BUTTON COMPONENT (Enhanced Accessibility & Focus Ring)
   -------------------------------------------------------------------------- */
export const Button = ({
  children,
  variant = 'primary', // primary | secondary | accent | outline | danger | ghost
  size = 'md',         // sm | md | lg
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  type = 'button',
  ariaLabel,
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const variantClass = `btn-${variant}`;

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-busy={loading ? 'true' : undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="spinner-sm animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 18} aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

/* --------------------------------------------------------------------------
   2. INPUT COMPONENT
   -------------------------------------------------------------------------- */
export const Input = ({
  label,
  error,
  helpText,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <input
        id={inputId}
        type={type}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
        {...props}
      />
      {error && <span id={`${inputId}-error`} className="form-error-text" role="alert">{error}</span>}
      {helpText && !error && <span id={`${inputId}-help`} className="form-help-text">{helpText}</span>}
    </div>
  );
};

/* --------------------------------------------------------------------------
   3. SELECT COMPONENT
   -------------------------------------------------------------------------- */
export const Select = ({
  label,
  options = [],
  error,
  helpText,
  className = '',
  id,
  children,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && <label htmlFor={selectId} className="form-label">{label}</label>}
      <select
        id={selectId}
        className={`select ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      >
        {children ? children : options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error-text" role="alert">{error}</span>}
      {helpText && !error && <span className="form-help-text">{helpText}</span>}
    </div>
  );
};

/* --------------------------------------------------------------------------
   4. BADGE / STATUS PILL COMPONENT
   -------------------------------------------------------------------------- */
export const Badge = ({
  children,
  variant = 'neutral', // primary | accent | success | warning | error | neutral
  dot = false,
  className = '',
  style = {}
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
};

/* --------------------------------------------------------------------------
   5. CARD COMPONENT
   -------------------------------------------------------------------------- */
export const Card = ({
  children,
  title,
  subtitle,
  action,
  footer,
  interactive = false,
  className = '',
  style = {},
  onClick
}) => {
  return (
    <div 
      className={`card ${interactive ? 'card-interactive' : ''} ${className}`} 
      style={style}
      onClick={onClick}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e);
        }
      }}
    >
      {(title || subtitle || action) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

/* --------------------------------------------------------------------------
   6. MODAL COMPONENT
   -------------------------------------------------------------------------- */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md', // sm | md | lg
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div 
        className={`modal modal-${size}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   6b. CONFIRMATION DIALOG MODAL COMPONENT
   -------------------------------------------------------------------------- */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // danger | primary | accent
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ padding: '8px 0' }}>
        <p className="text-secondary" style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
};

/* --------------------------------------------------------------------------
   7. TABS COMPONENT
   -------------------------------------------------------------------------- */
export const Tabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="tabs-nav" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`tab-item ${activeTab === tab.id ? 'tab-item-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <tab.icon size={16} style={{ marginRight: '6px' }} aria-hidden="true" />}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

/* --------------------------------------------------------------------------
   8. DROPDOWN COMPONENT
   -------------------------------------------------------------------------- */
export const Dropdown = ({ trigger, items = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dropdown">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="dropdown-menu" role="menu">
          {items.map((item, index) => (
            item.divider ? (
              <div key={index} className="dropdown-divider" role="separator" />
            ) : (
              <button
                key={index}
                role="menuitem"
                className="dropdown-item"
                onClick={() => {
                  if (item.onClick) item.onClick();
                  setIsOpen(false);
                }}
              >
                {item.icon && <item.icon size={14} aria-hidden="true" />}
                <span>{item.label}</span>
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
};

/* --------------------------------------------------------------------------
   9. ALERT COMPONENT
   -------------------------------------------------------------------------- */
export const Alert = ({
  type = 'info', // info | success | warning | error
  title,
  children,
  onClose,
}) => {
  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
  };
  const IconComponent = icons[type] || Info;

  return (
    <div className={`alert alert-${type}`} role="alert">
      <IconComponent size={20} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '2px' }} aria-label="Dismiss alert">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

/* --------------------------------------------------------------------------
   10. BREADCRUMBS COMPONENT
   -------------------------------------------------------------------------- */
export const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {isLast ? (
              <span className="breadcrumb-active" aria-current="page">{item.label}</span>
            ) : (
              <a href={item.href || '#'} className="breadcrumb-item">
                {item.label}
              </a>
            )}
            {!isLast && <span className="breadcrumb-separator" aria-hidden="true">/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

/* --------------------------------------------------------------------------
   11. PAGINATION COMPONENT
   -------------------------------------------------------------------------- */
export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalRecords,
}) => {
  return (
    <nav className="pagination" aria-label="Pagination Navigation">
      <div className="pagination-info">
        Showing page {currentPage} of {totalPages} {totalRecords ? `(${totalRecords} total items)` : ''}
      </div>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            className={`pagination-btn ${page === currentPage ? 'pagination-btn-active' : ''}`}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        <button
          className="pagination-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
};

/* --------------------------------------------------------------------------
   12. TOOLTIP COMPONENT
   -------------------------------------------------------------------------- */
export const Tooltip = ({ content, children }) => {
  return (
    <div className="tooltip-wrapper">
      {children}
      <div className="tooltip-content" role="tooltip">{content}</div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   13. SPINNER COMPONENT
   -------------------------------------------------------------------------- */
export const Spinner = ({ size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : '';
  return <span className={`spinner ${sizeClass}`} role="status" aria-label="Loading" />;
};

/* --------------------------------------------------------------------------
   14. SKELETON COMPONENT
   -------------------------------------------------------------------------- */
export const Skeleton = ({ width = '100%', height = '20px', style = {} }) => {
  return <div className="skeleton" style={{ width, height, ...style }} aria-hidden="true" />;
};

/* --------------------------------------------------------------------------
   15. EMPTY STATE COMPONENT
   -------------------------------------------------------------------------- */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Found',
  description = 'There are no records to display at this time.',
  action,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        <Icon size={28} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

/* --------------------------------------------------------------------------
   16. ERROR STATE COMPONENT
   -------------------------------------------------------------------------- */
export const ErrorState = ({
  title = 'Something Went Wrong',
  message = 'Failed to load data from the server. Please try again.',
  onRetry,
}) => {
  return (
    <div className="error-state" role="alert">
      <div className="error-state-icon" aria-hidden="true">
        <AlertCircle size={24} />
      </div>
      <h4 style={{ marginBottom: '4px' }}>{title}</h4>
      <p className="text-sm text-secondary" style={{ marginBottom: '16px', maxWidth: '380px' }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

/* --------------------------------------------------------------------------
   17. TABLE COMPONENT
   -------------------------------------------------------------------------- */
export const Table = ({ headers = [], children, hover = true, className = '' }) => {
  return (
    <div className={`table-container ${className}`}>
      <table className={`table ${hover ? 'table-hover' : ''}`}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};
