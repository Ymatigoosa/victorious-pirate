import React from 'react';

export const rolename = (role) =>
  role == 'admin'
    ? 'Администратор'
    : role == 'clerk'
      ? 'Секретарь'
      : role == 'teacher'
       ? 'Преподаватель'
       : `Неизвестная роль '${role}'`;

export const RoleName = ({role}) => (
  <span>{rolename(role)}</span>
);
