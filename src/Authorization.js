import React, { useState } from 'react';
import './styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Draggable from 'react-draggable';

export default function ОкноАвторизации({ ЗакрытьОкно }) {
    const [Пользователь, УстановитьПользователь] = useState('');
    const [Пароль, УстановитьПароль] = useState('');

    function СохранитьПарольВБД() {
        localStorage.setItem('Пользователь', Пользователь);
        localStorage.setItem('Пароль', Пароль);
    }

    return (
        <div className="background1">
            <Draggable handle='.handle'>
                <div className="window2">
                    <h4 className="handle">Авторизация</h4>

                    <Form.Group className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Логин"
                            value={Пользователь}
                            onChange={(e) => УстановитьПользователь(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Control
                            type="password"
                            placeholder="Пароль"
                            value={Пароль}
                            onChange={(e) => УстановитьПароль(e.target.value)}
                        />
                    </Form.Group>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button onClick={() => {
                            СохранитьПарольВБД();
                            ЗакрытьОкно();
                        }}>Сохранить</Button>
                        <Button variant="secondary" onClick={ЗакрытьОкно}>Закрыть</Button>
                    </div>
                </div>
            </Draggable>
        </div>
    );
}
