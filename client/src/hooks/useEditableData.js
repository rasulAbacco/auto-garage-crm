import { useState } from "react";

export const useEditableData = (initial = null) => {
  const [data, setData] = useState(initial);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  return { data, setData, isEditing, setIsEditing, handleEditChange };
};
