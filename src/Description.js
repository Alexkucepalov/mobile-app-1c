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


  const isEditable = () => {
    const today = new Date();
    const documentDate = new Date(document.Дата.replace(/(\d+).(\d+).(\d+)/, '$3-$2-$1'));
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - document.ДнейДляРедактирования); // вычисляем дату начала периода редактирования

    console.log(`Document Date: ${documentDate}`);
    console.log(`Today: ${today}`);
    console.log(`Past Date: ${pastDate}`);

    return documentDate >= pastDate && documentDate <= today; // проверяем, попадает ли дата документа в период редактирования
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
        <div className="window1" style={{ width: '100%', height: '100%', overflow: 'auto' }}>
          <h4 className="handle">Данные о документе ({docType === 'prihod' ? 'поступление' : 'реализация'})</h4>
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
                  {userRole.ЕстьРольЗакупка && isEditable() ? (
                    <input
                      type="text"
                      value={localData.mainDocument?.Комментарий ?? document.Комментарий}
                      onChange={(e) => handleChange(e, null, 'Комментарий')}
                    />
                  ) : (
                    <span>{localData.mainDocument?.Комментарий ?? document.Комментарий}</span>
                  )}
                </td>
                {docType === 'prihod' && (
                  <td>
                    {userRole.ЕстьРольСклад && isEditable() ? (
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
                    <span>{localData[index]?.Количество ?? item.Количество}</span>
                  </td>
                  {docType === 'prihod' && (
                    <>
                      <td>
                        {userRole.ЕстьРольЗакупка && isEditable() ? (
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
                        {userRole.ЕстьРольСклад && isEditable() ? (
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
                        {userRole.ЕстьРольЗакупка && isEditable() ? (
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
                    {userRole.ЕстьРольЗакупка && isEditable() ? (
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
            <Button variant="success" onClick={handleClick} disabled={!isEditable()}>Сохранить изменения</Button> 
            <Button variant="secondary" onClick={() => setShowDescription(false)}>Закрыть</Button>
          </div>
        </div>
      </Draggable>
    </div>
  );
}

export default Description;
