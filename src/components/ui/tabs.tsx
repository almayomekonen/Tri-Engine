import * as React from "react";

interface TabsProps {
  defaultValue: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  onValueChange,
  children,
  className = "",
}: TabsProps) {
  const [value, setValue] = React.useState(defaultValue);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<{
              activeValue?: string;
              onValueChange?: (value: string) => void;
            }>,
            {
              activeValue: value, // 🎯 רק את הvalue הפעיל
              onValueChange: handleValueChange,
            }
          );
        }
        return child;
      })}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  activeValue?: string;
  onValueChange?: (value: string) => void;
}

export function TabsList({
  children,
  className = "",
  activeValue,
  onValueChange,
}: TabsListProps) {
  return (
    <div className={`flex ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<{
              activeValue?: string;
              onValueChange?: (value: string) => void;
            }>,
            {
              activeValue, // 🎯 העברה נכונה
              onValueChange,
            }
          );
        }
        return child;
      })}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeValue?: string;
  onValueChange?: (value: string) => void;
}

export function TabsTrigger({
  value,
  children,
  className = "",
  activeValue,
  onValueChange,
}: TabsTriggerProps) {
  const handleClick = () => {
    onValueChange?.(value);
  };

  const isActive = activeValue === value;

  return (
    <button
      className={`${className} ${isActive ? "active" : ""}`}
      onClick={handleClick}
      type="button"
      data-active={isActive}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeValue?: string;
}

export function TabsContent({
  value,
  children,
  className = "",
  activeValue,
}: TabsContentProps) {
  const isActive = activeValue === value;

  if (!isActive) {
    return null;
  }

  return <div className={className}>{children}</div>;
}
