// Fetch IP and port from localStorage
const ip = localStorage.getItem('IP') || 'localhost';
const port = localStorage.getItem('Port') || '80';
let url_base = `http://${ip}:${port}/UT11/hs/api`;

if (process.env.NODE_ENV === 'development') {
    url_base = `/api`;
}

export const prihodproducts = 'prihodproducts';

export function fetch_patch(request, data, callback = null) {
    const login = localStorage.getItem('Пользователь');
    const passwd = localStorage.getItem('Пароль');

    const full_url = `${url_base}/${request}`;

    console.log(full_url);

    fetch(full_url, {
        method: 'PATCH',
        headers: {
            'Authorization': 'Basic ' + btoa(login + ':' + passwd),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка сети или сервера');
        }
        return response.json();
    })
    .then(responseData => {
        console.log('Данные успешно отправлены', responseData);
        callback && callback(responseData);
    })
    .catch(error => {
        console.error('Ошибка при отправке данных:', error);
    });
}

export function fetch_get(request, callback) {
    const login = localStorage.getItem('Пользователь');
    const passwd = localStorage.getItem('Пароль');

    fetch(`${url_base}/${request}`, {
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + btoa(login + ':' + passwd)
        }
    })
    .then(response => {
        if (!response.ok) {
            console.log("Ошибка выполнения запроса к серверу");
            return [];
        }
        return response.json();
    })
    .then(data => callback(data))
    .catch(error => console.error('Ошибка при отправке запроса:', error));
}

export async function fetch_post(request, data, callback = null) {
    const login = localStorage.getItem('Пользователь');
    const passwd = localStorage.getItem('Пароль');

    try {
        const response = await fetch(`${url_base}/${request}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(login + ':' + passwd)
            },
            body: JSON.stringify({ data: data }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error('Ошибка сети или сервера');
        }

        console.log('Данные успешно отправлены', responseData);

        if (callback) {
            callback && callback(responseData);
        }

        return responseData;
    } catch (error) {
        console.error('Ошибка при отправке данных:', error);
        throw error;
    }
}
