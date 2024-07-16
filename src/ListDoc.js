import React, { useState, useEffect, useRef } from 'react';
import Description from './Description';
import NewDocumentForm from './NewDocumentForm';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import './styles.css';
import { fetch_get } from './1cDB';

function ListDoc() {
  const [document, setDocument] = useState([]);
  const [showDescription, setShowDescription] = useState(false);
  const [showNewDocumentForm, setShowNewDocumentForm] = useState(false);
  const currentDocument = useRef(null);
  const [selectUID, setSelectUID] = useState(null);
  const [search, setSearch] = useState('');
  const [viewCompleted, setViewCompleted] = useState(true);
  const [startingDate, setStartingDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [docType, setDocType] = useState('prihod');
  const [userRole, setUserRole] = useState({ ЕстьРольСклад: false, ЕстьРольЗакупка: false });

  useEffect(() => {
    // Fetch user roles
    fetch_get('users', (users) => {
      const user = users.find(u => u.Наименование === localStorage.getItem('Пользователь'));
      if (user) {
        setUserRole({
          ЕстьРольСклад: user.ЕстьРольСклад,
          ЕстьРольЗакупка: user.ЕстьРольЗакупка
        });
      }
    });
  }, []);

  function updateDocuments() {
    if (startingDate !== '' && endDate !== '') {
      const startingDateString = new Date(startingDate.split('.').reverse().join('-')).toISOString().split('T')[0];
      const endDateString = new Date(endDate.split('.').reverse().join('-')).toISOString().split('T')[0];

      fetch_get(`${docType}?startingDate=${startingDateString}&endDate=${endDateString}`, setDocument);
      console.log("Обновились даты", docType);
    }
  }

  function callbackAfterUpdate() {
    setShowDescription(false);
    updateDocuments();
  }

  function callbackAfterCreate() {
    setShowNewDocumentForm(false);
    updateDocuments();
  }

  useEffect(() => {
    updateDocuments();
  }, [docType, startingDate, endDate]);

  return (
    <>
      <div className="panel-buttons-2">
        {userRole.ЕстьРольЗакупка && <Button onClick={() => setShowNewDocumentForm(true)}>Создать документ</Button>}
        <Button onClick={() => setShowDescription(true)}>Детали</Button>
        <Form.Group className="w-40">
          <Form.Control
            type="text"
            placeholder="Строка поиска"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Form.Group>
        <div className="date-group">
          <Form.Group className="date-group-item">
            <Form.Label className="date-label">с</Form.Label>
            <Form.Control
              type="date"
              placeholder="Дата начала"
              value={startingDate}
              onChange={(e) => setStartingDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="date-group-item">
            <Form.Label className="date-label">по</Form.Label>
            <Form.Control
              type="date"
              placeholder="Дата окончания"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Form.Group>
        </div>
        <Button onClick={() => setDocType('prihod')}>Показать приход</Button>
        {userRole.ЕстьРольСклад && <Button onClick={() => setDocType('rashod')}>Показать расход</Button>}
        <Button onClick={updateDocuments}>Обновить данные</Button>
      </div>
      <h4 className="text-center">{docType === 'prihod' ? 'Приходные накладные' : 'Расходные накладные'}</h4>
      <div style={{ width: '100%', height: 'calc(95vh - 100px)', overflow: 'auto' }}>
        <table className="table table-striped table-bordered table-hover">
          <thead className="custom-thead1">
            <tr>
              <th>Номер</th>
              <th>Дата</th>
              <th>Проведен</th>
              <th>КонтрагентНаименование</th>
              <th>ОрганизацияНаименование</th>
              {docType === 'prihod' && <th>ДатаВыгрузкиФакт</th>}
            </tr>
          </thead>
          <tbody>
            {document
              .filter(doc =>
                doc.КонтрагентНаименование.toLowerCase().includes(search.toLowerCase()) &&
                ((viewCompleted && doc.Проведен) || !doc.Проведен)
              )
              .map(doc => (
                <tr
                  key={doc.УИД}
                  className={doc.УИД === selectUID ? "selected-row" : ""}
                  onClick={() => { currentDocument.current = doc; setSelectUID(doc.УИД); }}
                  onDoubleClick={() => setShowDescription(true)}
                >
                  <td>{doc.Номер}</td>
                  <td>{doc.Дата}</td>
                  <td>
                    <input className="form-check-input" type="checkbox" checked={doc.Проведен} disabled />
                  </td>
                  <td>{doc.КонтрагентНаименование}</td>
                  <td>{doc.ОрганизацияНаименование}</td>
                  {docType === 'prihod' && <td>{doc.ДатаВыгрузкиФакт}</td>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showDescription && <Description document={currentDocument.current} setShowDescription={setShowDescription} callbackAfterUpdate={callbackAfterUpdate} docType={docType} />}
      <NewDocumentForm show={showNewDocumentForm} setShow={setShowNewDocumentForm} callbackAfterCreate={callbackAfterCreate} docType={docType} />
    </>
  );
}

export default ListDoc;
