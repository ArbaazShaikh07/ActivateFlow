import { useState } from "react";

const EditableCell = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="editable-input"
        autoFocus
        data-testid="editable-input"
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className="editable-cell"
      title="Double-click to edit"
      data-testid="editable-cell"
    >
      {typeof value === 'number' ? value.toLocaleString() : value}
    </span>
  );
};

export default EditableCell;