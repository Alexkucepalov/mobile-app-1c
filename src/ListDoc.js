import React, { useState, useEffect, useRef } from 'react';
import Description from './Description';
import Button from 'react-bootstrap/Button';
import './styles.css';
import Form from 'react-bootstrap/Form';
import { fetch_get } from './1cDB';

function ListDoc() {
  const [document, setDocument] = useState([]);
  const [showDescription, setShowDescription] = useState(false);
  const currentDocument = useRef(null);
  const [selectUID, setSelectUID] = useState(null);
  const [search, setSearch] = useState('');
  const [viewCompleted, setViewCompleted] = useState(true);
  const [startingDate, setStartingDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [docType, setDocType] = useState('prihod'); // состояние для типа документов

  function updateDocuments() {
    const startingDateString = startingDate !== '' ? new Date(startingDate.split('.').reverse().join('-')).toISOString().split('T')[0] : '';
    const endDateString = endDate !== '' ? new Date(endDate.split('.').reverse().join('-')).toISOString().split('T')[0] : '';

    fetch_get(`${docType}?startingDate=${startingDateString}&endDate=${endDateString}`, setDocument);
    console.log("Обновились даты", docType);
  }

  function callbackAfterUpdate() {
    setShowDescription(false);
    updateDocuments();
  }

  useEffect(() => {
    updateDocuments();
  }, [docType]); // обновлять документы при изменении типа документов

  useEffect(() => {
    updateDocuments();
  }, [startingDate, endDate]); // обновлять документы при изменении дат

  return (
    <>
      <div className="panel-buttons-2">
        <Button onClick={() => setShowDescription(true)}>Детали</Button>
        <Form.Group className="w-40">
          <Form.Control
            type="text"
            placeholder="Строка поиска"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formBasicCheckbox">
          <Form.Check
            type="checkbox"
            label="Показать проведенные"
            checked={viewCompleted}
            onChange={() => setViewCompleted(prev => !prev)}
          />
        </Form.Group>
        <Form.Group className="w-12">
          <Form.Control
            type="date"
            value={startingDate}
            onChange={(e) => setStartingDate(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="w-12">
          <Form.Control
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Form.Group>
        <Button onClick={() => setDocType('prihod')}>Показать приход</Button>
        <Button onClick={() => setDocType('rashod')}>Показать расход</Button>
      </div>
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
            {
              document
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
                ))
            }
          </tbody>
        </table>
      </div>

      {showDescription && <Description document={currentDocument.current} setShowDescription={setShowDescription} callbackAfterUpdate={callbackAfterUpdate} docType={docType} />}
    </>
  );
}

export default ListDoc;
