import React, { memo } from 'react';

interface LoginButtonProps {
  text: string,
  onLogin: () => void;
  logo?: string,
}

const LoginButton: React.FC<LoginButtonProps> = ({ text, onLogin }) => {
  return (
    <button onClick={onLogin}>{text}</button>
  );
}

export default memo(LoginButton);
