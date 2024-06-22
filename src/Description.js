import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import Button from 'react-bootstrap/Button';
import './styles.css';
import { fetch_patch, fetch_get } from './1cDB';

function Description({ document, setShowDescription, callbackAfterUpdate, docType }) {
  const [description, setDescription] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState({ ЕстьРольСклад: false, ЕстьРольЗакупка: false });
  const [localData, setLocalData] = useState({});

  useEffect(() => {
    fetch_get('users', (users) => {
      const user = users.find(u => u.Наименование === localStorage.getItem('Пользователь'));
      if (user) {
        setUserRole({
          ЕстьРольСклад: user.ЕстьРольСклад,
          ЕстьРольЗакупка: user.ЕстьРольЗакупка
        });
      }
    });

    if (document) {
      fetch_get(`${docType}products?УИД=${document.УИД}`, setDescription);
    } else {
      fetch_get(`${docType}products`, setDescription);
    }
    setLoading(false);
  }, [document, docType]);

  const recalculate = (index, key, value) => {
    const updatedItem = { ...description[index], ...localData[index], [key]: value };

    if (docType === 'prihod') {
      const newQuantity = (updatedItem.ВесЗагрузки * (100 - updatedItem.ПроцентПотерь)) / 100;
      const newSum = (newQuantity * updatedItem.Цена).toFixed(2);

      return {
        ...localData,
        [index]: {
          ...localData[index],
          [key]: value,
          Количество: newQuantity,
          Сумма: newSum
        }
      };
    } else {
      const newSum = (updatedItem.Количество * updatedItem.Цена).toFixed(2);

      return {
        ...localData,
        [index]: {
          ...localData[index],
          [key]: value,
          Сумма: newSum
        }
      };
    }
  };

  const handleChange = (e, index, key) => {
    const newValue = e.target.type === 'date' ? e.target.value : parseFloat(e.target.value) || e.target.value;
    const updatedData = key === 'ДатаВыгрузкиФакт' || key === 'Комментарий'
      ? { ...localData, mainDocument: { ...localData.mainDocument, [key]: newValue } }
      : recalculate(index, key, newValue);

    setLocalData(updatedData);
  };

  const handleClick = () => {
    if (localData.mainDocument) {
      fetch_patch(`${docType}`, {
        УИД: document.УИД,
        ...localData.mainDocument
      }, () => {
        callbackAfterUpdate();
      });
    }

    description.forEach((item, index) => {
      const update = localData[index];
      if (update) {
        fetch_patch(`${docType}products`, {
          НомерСтроки: item.НомерСтроки,
          УИД: item.УИД,
          УИДН: item.УИДН,
          ...update
        }, () => {
          callbackAfterUpdate();
        });
      }
    });

    setShowDescription(false);
  };

  if (loading) {
    return <div>Загрузка данных...</div>;
  }

  if (!description || !description.length) {
    return <div>Данные отсутствуют</div>;
  }

  return (
    <div className="background2">
      <Draggable handle=".handle">
        <div className="window1" style={{ width: '90%', height: 'calc(55vh)', overflow: 'auto' }}>
          <h4 className="handle">Данные о документе</h4>
          <table className="table table-striped table-bordered table-hover">
            <thead className="custom-thead1">
              <tr>
                <th>Номер</th>
                <th>Дата</th>
                <th>КонтрагентНаименование</th>
                <th>ОрганизацияНаименование</th>
                <th>Комментарий</th>
                {docType === 'prihod' && <th>ДатаВыгрузкиФакт</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{document.Номер}</td>
                <td>{document.Дата}</td>
                <td>{document.КонтрагентНаименование}</td>
                <td>{document.ОрганизацияНаименование}</td>
                <td>
                  <input
                    type="text"
                    value={localData.mainDocument?.Комментарий ?? document.Комментарий}
                    onChange={(e) => handleChange(e, null, 'Комментарий')}
                  />
                </td>
                {docType === 'prihod' && (
                  <td>
                    {userRole.ЕстьРольСклад ? (
                      <input
                        type="date"
                        value={localData.mainDocument?.ДатаВыгрузкиФакт ?? document.ДатаВыгрузкиФакт}
                        onChange={(e) => handleChange(e, null, 'ДатаВыгрузкиФакт')}
                      />
                    ) : (
                      <span>{localData.mainDocument?.ДатаВыгрузкиФакт ?? document.ДатаВыгрузкиФакт}</span>
                    )}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
          <h4 className="handle">Детали документа</h4>
          <table className="table table-striped table-bordered table-hover">
            <thead className="custom-thead1">
              <tr>
                <th>НомерСтроки</th>
                <th>НоменклатураНаименование</th>
                <th>Количество</th>
                {docType === 'prihod' && (
                  <>
                    <th>ВесЗагрузки</th>
                    <th>ВесВыгрузки</th>
                    <th>ПроцентПотерь</th>
                  </>
                )}
                <th>Цена</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {description.map((item, index) => (
                <tr key={item.УИД}>
                  <td>{item.НомерСтроки}</td>
                  <td>{item.НоменклатураНаименование}</td>
                  <td>
                    {userRole.ЕстьРольЗакупка ? (
                      <input
                        type="text"
                        value={localData[index]?.Количество ?? item.Количество}
                        onChange={(e) => handleChange(e, index, 'Количество')}
                      />
                    ) : (
                      <span>{localData[index]?.Количество ?? item.Количество}</span>
                    )}
                  </td>
                  {docType === 'prihod' && (
                    <>
                      <td>
                        {userRole.ЕстьРольЗакупка ? (
                          <input
                            type="text"
                            value={localData[index]?.ВесЗагрузки ?? item.ВесЗагрузки}
                            onChange={(e) => handleChange(e, index, 'ВесЗагрузки')}
                          />
                        ) : (
                          <span>{localData[index]?.ВесЗагрузки ?? item.ВесЗагрузки}</span>
                        )}
                      </td>
                      <td>
                        {userRole.ЕстьРольСклад ? (
                          <input
                            type="text"
                            value={localData[index]?.ВесВыгрузки ?? item.ВесВыгрузки}
                            onChange={(e) => handleChange(e, index, 'ВесВыгрузки')}
                          />
                        ) : (
                          <span>{localData[index]?.ВесВыгрузки ?? item.ВесВыгрузки}</span>
                        )}
                      </td>
                      <td>
                        {userRole.ЕстьРольЗакупка ? (
                          <input
                            type="text"
                            value={localData[index]?.ПроцентПотерь ?? item.ПроцентПотерь}
                            onChange={(e) => handleChange(e, index, 'ПроцентПотерь')}
                          />
                        ) : (
                          <span>{localData[index]?.ПроцентПотерь ?? item.ПроцентПотерь}</span>
                        )}
                      </td>
                    </>
                  )}
                  <td>
                    {userRole.ЕстьРольЗакупка ? (
                      <input
                        type="text"
                        value={localData[index]?.Цена ?? item.Цена}
                        onChange={(e) => handleChange(e, index, 'Цена')}
                      />
                    ) : (
                      <span>{localData[index]?.Цена ?? item.Цена}</span>
                    )}
                  </td>
                  <td>
                    <span>{localData[index]?.Сумма ?? item.Сумма}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ gap: '10px', display: 'flex', marginTop: '10px' }}>
            <Button onClick={() => setShowDescription(false)}>Закрыть</Button>
            <Button onClick={handleClick}>Сохранить изменения</Button>
          </div>
        </div>
      </Draggable>
    </div>
  );
}

export default Description;
