import React, { useState, useEffect, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import './styles.css';
import Form from 'react-bootstrap/Form';
import Draggable from 'react-draggable';
import {fetch_get} from './1cDB';

export default function ListUser({ ФункцияОбратногоВызоваДляОбработкиВыбораПользователя, setпоказатьВыбратьПользователя }) {
    const [Пользователи, setПользователей] = useState([]);
    const ТекущийПользователь = useRef(null);
    const [выбранныйУИД, setВыбранныйУИД] = useState(null);
    const [СтрокаПоиска, setСтрокаПоиска] = useState('');

    function Обновить() {
        fetch_get('users', setПользователей);
    }

    function ОбработкаВыбора() {
        ФункцияОбратногоВызоваДляОбработкиВыбораПользователя(ТекущийПользователь.current);
    }

    useEffect(() => {
        Обновить();
    }, []);

    return (
        <div className="background2">
            <Draggable handle=".handle">
                <div className="window1">
                    <h4 className="handle">Выберите пользователя</h4>
                    <div className="panel-buttons-2">
                        <Button onClick={Обновить}>Обновить</Button>
                        <Button onClick={ОбработкаВыбора}>Выбрать</Button>
                        <Button onClick={() => setпоказатьВыбратьПользователя(false)}>Закрыть</Button>
                        <Form.Group className="w-25">
                            <Form.Control
                                type="text"
                                placeholder="Строка поиска"
                                value={СтрокаПоиска}
                                onChange={(e) => setСтрокаПоиска(e.target.value)}
                            />
                        </Form.Group>
                    </div>
                    <div style={{ width: '100%', height: 'calc(50vh - 100px)', overflow: 'auto' }}>
                        <table className="table table-striped table-bordered table-hover">
                            <thead className="custom-thead1">
                                <tr>
                                    <th>Наименование</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Пользователи.filter(пользователь => пользователь.Наименование.toLowerCase().includes(СтрокаПоиска.toLowerCase())).map(пользователь => (
                                    <tr key={пользователь.УИД} className={пользователь.УИД === выбранныйУИД ? "selected-row" : ""} onClick={() => { ТекущийПользователь.current = пользователь; setВыбранныйУИД(пользователь.УИД); }} onDoubleClick={() => ФункцияОбратногоВызоваДляОбработкиВыбораПользователя(ТекущийПользователь.current)}>
                                        <td>{пользователь.Наименование}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Draggable>
        </div>
    );
}
