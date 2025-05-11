import React from 'react';
import type { TelegramUser } from '../types/telegram';

interface UserProfileProps {
  user: TelegramUser;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="user-info">
      {user.photo_url && (
        <div className="user-photo">
          <img src={user.photo_url} alt={`${user.first_name}'s avatar`} />
        </div>
      )}
      <h2 className="user-name">
        {user.first_name} {user.last_name || ''}
        {user.is_premium && <span className="premium-badge">⭐</span>}
      </h2>
      {user.username && <p className="user-username">@{user.username}</p>}
      <div className="user-details">
        <p><strong>ID:</strong> {user.id}</p>
        {user.language_code && <p><strong>Язык:</strong> {user.language_code}</p>}
        {user.added_to_attachment_menu && (
          <p><strong>Добавлен в меню вложений:</strong> Да</p>
        )}
        {user.allows_write_to_pm && (
          <p><strong>Разрешены сообщения от бота:</strong> Да</p>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 