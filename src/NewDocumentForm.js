import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Select from 'react-select';
import { fetch_post, fetch_get } from './1cDB';
import './styles.css';

const initialDetail = {
  НоменклатураНаименование: '',
  НоменклатураУИД: '',
  Количество: '',
  ВесЗагрузки: '',
  ПроцентПотерь: '',
  Цена: '',
  Сумма: '',
};

function NewDocumentForm({ show, setShow, callbackAfterCreate, docType }) {
  const [newDocument, setNewDocument] = useState({
    Дата: '',
    КонтрагентНаименование: '',
    КонтрагентУИД: '',
    ОрганизацияНаименование: '',
    ОрганизацияУИД: '',
    ДоговорНаименование: '',
    ДоговорУИД: '',
    СкладНаименование: 'Основной склад', // Default value
    СкладУИД: '', // Default value will be set in useEffect
    Детали: [initialDetail],
  });

  const [kontragents, setKontragents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [dogovors, setDogovors] = useState([]);
  const [sklads, setSklads] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (show) {
      fetch_get('kontragent', setKontragents);
      fetch_get('organization', setOrganizations);
      fetch_get('sklad', (data) => {
        setSklads(data);
        const mainSklad = data.find(sklad => sklad.Наименование === 'Основной склад');
        if (mainSklad) {
          setNewDocument((prevDocument) => ({
            ...prevDocument,
            СкладУИД: mainSklad.УИД,
            СкладНаименование: mainSklad.Наименование,
          }));
        }
      });
      fetch_get('products', setProducts);
      setNewDocument({
        Дата: '',
        КонтрагентНаименование: '',
        КонтрагентУИД: '',
        ОрганизацияНаименование: '',
        ОрганизацияУИД: '',
        ДоговорНаименование: '',
        ДоговорУИД: '',
        СкладНаименование: 'Основной склад', // Default value
        СкладУИД: '', // Default value will be set in useEffect
        Детали: [initialDetail],
      });
      setValidationError(null); // Сброс ошибки при открытии формы
    }
  }, [show]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError(null);

    if (!newDocument.Дата || !newDocument.КонтрагентУИД || !newDocument.ОрганизацияУИД || !newDocument.ДоговорУИД || !newDocument.СкладУИД) {
      setValidationError('Вы заполнили не все поля.');
      return;
    }

    const detailsIncomplete = newDocument.Детали.some(detail => 
      !detail.НоменклатураНаименование || 
      !detail.ВесЗагрузки || 
      !detail.ПроцентПотерь || 
      !detail.Цена
    );

    if (detailsIncomplete) {
      setValidationError('Вы заполнили не все поля в деталях документа.');
      return;
    }

    setIsSubmitting(true); // Show user message
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      await fetch_post(docType, newDocument, (response) => {
        if (response) {
          setSuccessMessage('Документ успешно создан и отправлен');
          callbackAfterCreate();
        } else {
          setSuccessMessage('Документ успешно создан и отправлен, но сервер вернул пустой ответ');
          callbackAfterCreate();
        }
      });
    } catch (error) {
      setSubmitError('Ошибка при создании документа, обратитесь к разработчику');
      console.error('Ошибка при создании документа, обратитесь к разработчику:', error);
    } finally {
      setIsSubmitting(false); // Hide user message
    }
  };

  useEffect(() => {
    if (submitError || successMessage) {
      const timer = setTimeout(() => {
        setSubmitError(null);
        setSuccessMessage(null);
        setShow(false); // Закрыть модальное окно после скрытия сообщения
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitError, successMessage, setShow]);

  const addDetail = () => {
    setNewDocument((prevDocument) => ({
      ...prevDocument,
      Детали: [...prevDocument.Детали, initialDetail],
    }));
  };

  const removeDetail = (index) => {
    setNewDocument((prevDocument) => ({
      ...prevDocument,
      Детали: prevDocument.Детали.filter((_, i) => i !== index),
    }));
  };

  const handleDetailChange = (e, index) => {
    const { name, value } = e.target;
    const updatedDetails = [...newDocument.Детали];
    if (name === 'НоменклатураНаименование') {
      const selectedProduct = products.find(product => product.Наименование === value);
      updatedDetails[index].НоменклатураУИД = selectedProduct?.УИД || '';
    }
    updatedDetails[index] = { ...updatedDetails[index], [name]: value };

    if (name === 'ВесЗагрузки' || name === 'ПроцентПотерь' || name === 'Цена') {
      const newQuantity = (updatedDetails[index].ВесЗагрузки * (100 - updatedDetails[index].ПроцентПотерь)) / 100;
      const newSum = (newQuantity * updatedDetails[index].Цена).toFixed(2);
      updatedDetails[index].Количество = newQuantity || '';
      updatedDetails[index].Сумма = newSum || '';
    }

    setNewDocument((prevDocument) => ({
      ...prevDocument,
      Детали: updatedDetails,
    }));
  };

  const handleSelectChange = (selectedOption, index, type) => {
    const updatedDetails = [...newDocument.Детали];
    if (type === 'Номенклатура') {
      updatedDetails[index].НоменклатураНаименование = selectedOption.label;
      updatedDetails[index].НоменклатураУИД = selectedOption.value;
    } else {
      setNewDocument((prevDocument) => ({
        ...prevDocument,
        [`${type}Наименование`]: selectedOption.label,
        [`${type}УИД`]: selectedOption.value,
        ...(type === 'Контрагент' || type === 'Организация' ? {
          ДоговорНаименование: '',
          ДоговорУИД: ''
        } : {})
      }));

      if (type === 'Контрагент' || 'Организация') {
        const kontragentUID = type === 'Контрагент' ? selectedOption.value : newDocument.КонтрагентУИД;
        const organizationUID = type === 'Организация' ? selectedOption.value : newDocument.ОрганизацияУИД;

        if (kontragentUID && organizationUID) {
          fetch_get(`dogovor?kontragentUID=${kontragentUID}&organizationUID=${organizationUID}`, setDogovors);
        }
      }
    }
    setNewDocument((prevDocument) => ({
      ...prevDocument,
      Детали: updatedDetails,
    }));
  };

  return (
    <>
      <Modal show={show} onHide={() => setShow(false)} size="lg">
        <div>
          <Modal.Header className="handle">
            <Modal.Title>Создать документ</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {validationError && <div className="alert alert-danger">{validationError}</div>}
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formBasicDate">
                <Form.Label>Дата</Form.Label>
                <Form.Control
                  type="date"
                  value={newDocument.Дата}
                  onChange={(e) => setNewDocument({ ...newDocument, Дата: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="formKontragent">
                <Form.Label>Контрагент</Form.Label>
                <Select
                  options={kontragents.map(k => ({ value: k.УИД, label: k.Наименование }))}
                  onChange={(selectedOption) => handleSelectChange(selectedOption, null, 'Контрагент')}
                  value={{ value: newDocument.КонтрагентУИД, label: newDocument.КонтрагентНаименование }}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      maxWidth: '100%',
                    }),
                    menu: (provided) => ({
                      ...provided,
                      overflowX: 'auto',
                    }),
                  }}
                />
              </Form.Group>
              <Form.Group controlId="formOrganization">
                <Form.Label>Организация</Form.Label>
                <Select
                  options={organizations.map(k => ({ value: k.УИД, label: k.Наименование }))}
                  onChange={(selectedOption) => handleSelectChange(selectedOption, null, 'Организация')}
                  value={{ value: newDocument.ОрганизацияУИД, label: newDocument.ОрганизацияНаименование }}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      maxWidth: '100%',
                    }),
                    menu: (provided) => ({
                      ...provided,
                      overflowX: 'auto',
                    }),
                  }}
                />
              </Form.Group>
              <Form.Group controlId="formDogovor">
                <Form.Label>Договор</Form.Label>
                <Select
                  options={dogovors.map(k => ({ value: k.УИД, label: k.Наименование }))}
                  onChange={(selectedOption) => handleSelectChange(selectedOption, null, 'Договор')}
                  value={{ value: newDocument.ДоговорУИД, label: newDocument.ДоговорНаименование }}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      maxWidth: '100%',
                    }),
                    menu: (provided) => ({
                      ...provided,
                      overflowX: 'auto',
                    }),
                  }}
                />
              </Form.Group>
              <Form.Group controlId="formSklad">
                <Form.Label>Склад</Form.Label>
                <Select
                  options={sklads.map(k => ({ value: k.УИД, label: k.Наименование }))}
                  onChange={(selectedOption) => handleSelectChange(selectedOption, null, 'Склад')}
                  value={{ value: newDocument.СкладУИД, label: newDocument.СкладНаименование }}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      maxWidth: '100%',
                    }),
                    menu: (provided) => ({
                      ...provided,
                      overflowX: 'auto',
                    }),
                  }}
                />
              </Form.Group>
              <Form.Group controlId="formDetails">
                <h5><Form.Label>Детали документа</Form.Label></h5>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th style={{ minWidth: '200px' }}>Номенклатура</th>
                        <th>Количество</th>
                        <th style={{ minWidth: '120px' }}>Вес загрузки</th>
                        <th style={{ minWidth: '50px' }}>Процент потерь</th>
                        <th style={{ minWidth: '150px' }}>Цена</th>
                        <th style={{ minWidth: '150px' }}>Сумма</th>
                        <th>Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newDocument.Детали.map((detail, index) => (
                        <tr key={index}>
                          <td>
                            <Form.Control
                              as="select"
                              name="НоменклатураНаименование"
                              value={detail.НоменклатураНаименование}
                              onChange={(e) => handleDetailChange(e, index)}
                            >
                              <option value="">Выберите товар...</option>
                              {products.map((product) => (
                                <option key={product.УИД} value={product.Наименование}>
                                  {product.Наименование}
                                </option>
                              ))}
                            </Form.Control>
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              name="Количество"
                              value={detail.Количество}
                              readOnly
                              style={{ background: '#f2f2f2', cursor: 'not-allowed' }}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              name="ВесЗагрузки"
                              value={detail.ВесЗагрузки}
                              onChange={(e) => handleDetailChange(e, index)}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              name="ПроцентПотерь"
                              value={detail.ПроцентПотерь}
                              onChange={(e) => handleDetailChange(e, index)}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              name="Цена"
                              value={detail.Цена}
                              onChange={(e) => handleDetailChange(e, index)}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              name="Сумма"
                              value={detail.Сумма}
                              readOnly
                            />
                          </td>
                          <td>
                            <Button variant="danger" size="sm" onClick={() => removeDetail(index)}>Удалить</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <Button variant="primary" size="sm" onClick={addDetail}>Добавить</Button>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShow(false)}>Отмена</Button>
            <Button variant="success" onClick={handleSubmit}>Создать документ</Button>
          </Modal.Footer>
        </div>

        {/* Submitting Modal */}
        <Modal show={isSubmitting}>
          <Modal.Header>
            <Modal.Title>Пожалуйста, подождите</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Отправляем ваш запрос, создаем документ...</p>
          </Modal.Body>
        </Modal>

        {/* Error Modal */}
        <Modal show={!!submitError} onHide={() => setSubmitError(null)}>
          <Modal.Header closeButton>
            <Modal.Title>Ошибка</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{submitError}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSubmitError(null)}>Закрыть</Button>
          </Modal.Footer>
        </Modal>

        {/* Success Modal */}
        <Modal show={!!successMessage} onHide={() => setSuccessMessage(null)}>
          <Modal.Header closeButton>
            <Modal.Title>Успех</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{successMessage}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSuccessMessage(null)}>Закрыть</Button>
          </Modal.Footer>
        </Modal>
      </Modal>
    </>
  );
}

export default NewDocumentForm;
