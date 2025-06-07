import React from 'react';

// map으로 사용할 이미지 선택해서 업로드
const ImageUploader = ({ onImageSelected }) => {
  const handleChange = (e) => {
    const file = e.target.files[0]; // 첫 번째, 최신 파일만
    if (file) {
      onImageSelected(file); // 전달
    }
  };

  return (
    // Image Upload Button
    <label
      style={{
        display: 'inline-block',
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        marginLeft: '20px'
      }}
    >
      Upload Your Map
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }} // 실제 button
      />
    </label>
  );
};

export default ImageUploader;