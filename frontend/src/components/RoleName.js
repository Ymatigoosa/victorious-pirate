import React from 'react';

export const rolename = (role) =>
  role == 'admin'
    ? 'Администратор'
    : role == 'clerk'
      ? 'Секретарь'
      : role == 'teacher'
       ? 'Учитель'
       : `Неизвестная роль '${role}'`;

export const RoleName = ({role}) => (
  <span>{rolename(role)}</span>
);
