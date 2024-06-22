import React, { useState, useEffect } from 'react';
import Authorization from './Authorization';
import Button from 'react-bootstrap/Button';
import ListDoc from './ListDoc';
import './styles.css';
import { fetch_get } from './1cDB';

function App() {
  const [ОтображаетсяАвторизация, УстановитьОтображаетсяАвторизация] = useState(false);
  const [ТекущийПользователь, УстановитьТекущийПользователь] = useState('');
  const [рольПользователя, УстановитьРольПользователя] = useState('');

  useEffect(() => {
    const пользователь = localStorage.getItem('Пользователь');
    УстановитьТекущийПользователь(пользователь);

    fetch_get('users', (users) => {
      const user = users.find(u => u.Наименование === пользователь);
      if (user) {
        const roles = [];
        if (user.ЕстьРольСклад) roles.push('Склад');
        if (user.ЕстьРольЗакупка) roles.push('Закупка');
        // Add other roles if needed
        УстановитьРольПользователя(roles.join(', '));
      }
    });
  }, []);

  return (
    <div className="App">
      <div className="panel-buttons">
        <div style={{ width: '100%', justifyContent: 'center', display: 'grid' }}>
          <h4 style={{ color: 'antiquewhite' }}>
            Текущий пользователь ({ТекущийПользователь})
          </h4>
          {рольПользователя && (
            <p style={{ color: 'antiquewhite' }}>
              Роль: {рольПользователя}
            </p>
          )}
        </div>
        <Button onClick={() => УстановитьОтображаетсяАвторизация(true)}>
          Настройки
        </Button>
      </div>
      <ListDoc />
      {ОтображаетсяАвторизация && (
        <Authorization
          ЗакрытьОкно={() => {
            УстановитьОтображаетсяАвторизация(false);
            УстановитьТекущийПользователь(localStorage.getItem('Пользователь'));
          }}
        />
      )}
    </div>
  );
}

export default App;
