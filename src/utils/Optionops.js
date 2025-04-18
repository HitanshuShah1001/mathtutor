export const handleAddOptionNew = ({ setNewQuestion }) => {
  setNewQuestion((prev) => {
    const newOptions = [...prev.options];
    const newKey = String.fromCharCode(65 + newOptions.length);
    newOptions.push({ key: newKey, option: "", imageUrl: "" });
    return { ...prev, options: newOptions };
  });
};

export const handleRemoveOptionNew = ({index, setNewQuestion}) => {
  setNewQuestion((prev) => {
    let newOptions = [...prev.options];
    if (newOptions.length > 2) {
      newOptions.splice(index, 1);
      newOptions = newOptions.map((opt, idx) => ({
        ...opt,
        key: String.fromCharCode(65 + idx),
      }));
      return { ...prev, options: newOptions };
    }
    return prev;
  });
};

export const handleAddOptionEdit = ({setEditedQuestion}) => {
  setEditedQuestion((prev) => {
    const newOptions = [...(prev.options || [])];
    const newKey = String.fromCharCode(65 + newOptions.length);
    newOptions.push({ key: newKey, option: "", imageUrl: "" });
    return { ...prev, options: newOptions };
  });
};

export const handleRemoveOptionEdit = ({index,setEditedQuestion}) => {
  setEditedQuestion((prev) => {
    let newOptions = [...(prev.options || [])];
    if (newOptions.length > 2) {
      newOptions.splice(index, 1);
      newOptions = newOptions.map((opt, idx) => ({
        ...opt,
        key: String.fromCharCode(65 + idx),
      }));
      return { ...prev, options: newOptions };
    }
    return prev;
  });
};
