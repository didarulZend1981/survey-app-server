survey App react multiple question "Title.Description.,Options (yes or no), Category,
 Deadline.(type date)" step by step



 ###### Modify src/index.js:

 import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

ReactDOM.render(
    <Router>
        <App />
    </Router>,
    document.getElementById('root')
);


src/App.js
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import CreateSurvey from './components/CreateSurvey';
import SurveyList from './components/SurveyList';

const App = () => {
    return (
        <div>
            <Switch>
                <Route path="/" exact component={Home} />
                <Route path="/create" component={CreateSurvey} />
                <Route path="/surveys" component={SurveyList} />
            </Switch>
        </div>
    );
};

export default App;


src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
    <div>
        <h1>Welcome to the Survey App</h1>
        <Link to="/create">Create a Survey</Link><br />
        <Link to="/surveys">View Surveys</Link>
    </div>
);

export default Home;



src/components/CreateSurvey.js


import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

const CreateSurvey = () => {
    const [survey, setSurvey] = useState({
        title: '',
        description: '',
        options: ['Yes', 'No'],
        category: '',
        deadline: new Date()
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSurvey({ ...survey, [name]: value });
    };

    const handleDateChange = (date) => {
        setSurvey({ ...survey, deadline: date });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('/api/surveys', survey)
            .then(response => {
                alert('Survey created successfully');
            })
            .catch(error => {
                console.error('There was an error creating the survey!', error);
            });
    };

    return (
        <div>
            <h2>Create a Survey</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title:</label>
                    <input type="text" name="title" value={survey.title} onChange={handleChange} required />
                </div>
                <div>
                    <label>Description:</label>
                    <textarea name="description" value={survey.description} onChange={handleChange} required />
                </div>
                <div>
                    <label>Category:</label>
                    <input type="text" name="category" value={survey.category} onChange={handleChange} required />
                </div>
                <div>
                    <label>Deadline:</label>
                    <DatePicker selected={survey.deadline} onChange={handleDateChange} required />
                </div>
                <button type="submit">Create Survey</button>
            </form>
        </div>
    );
};

export default CreateSurvey;

SurveyList Component: src/components/SurveyList.js


import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SurveyList = () => {
    const [surveys, setSurveys] = useState([]);

    useEffect(() => {
        axios.get('/api/surveys')
            .then(response => {
                setSurveys(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching the surveys!', error);
            });
    }, []);

    return (
        <div>
            <h2>Surveys</h2>
            <ul>
                {surveys.map(survey => (
                    <li key={survey.id}>
                        <h3>{survey.title}</h3>
                        <p>{survey.description}</p>
                        <p>Category: {survey.category}</p>
                        <p>Deadline: {new Date(survey.deadline).toLocaleDateString()}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SurveyList;






backend/server.js



const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());

app.use(cors());

mongoose.connect('mongodb://localhost/surveys', { useNewUrlParser: true, useUnifiedTopology: true });

const surveySchema = new mongoose.Schema({
    title: String,
    description: String,
    options: [String],
    category: String,
    deadline: Date
});

const Survey = mongoose.model('Survey', surveySchema);

app.post('/api/surveys', (req, res) => {
    const survey = new Survey(req.body);
    survey.save()
        .then(() => res.json(survey))
        .catch(err => res.status(400).json('Error: ' + err));
});

app.get('/api/surveys', (req, res) => {
    Survey.find()
        .then(surveys => res.json(surveys))
        .catch(err => res.status(400).json('Error: ' + err));
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});




















































Update Components to Handle Multiple Questions




src/components/CreateSurvey.js



import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

const CreateSurvey = () => {
    const [survey, setSurvey] = useState({
        title: '',
        description: '',
        questions: [],
        category: '',
        deadline: new Date()
    });

    const [question, setQuestion] = useState({
        title: '',
        description: '',
        options: ['Yes', 'No']
    });

    const handleSurveyChange = (e) => {
        const { name, value } = e.target;
        setSurvey({ ...survey, [name]: value });
    };

    const handleDateChange = (date) => {
        setSurvey({ ...survey, deadline: date });
    };

    const handleQuestionChange = (e) => {
        const { name, value } = e.target;
        setQuestion({ ...question, [name]: value });
    };

    const addQuestion = () => {
        setSurvey({ ...survey, questions: [...survey.questions, question] });
        setQuestion({ title: '', description: '', options: ['Yes', 'No'] });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('/api/surveys', survey)
            .then(response => {
                alert('Survey created successfully');
            })
            .catch(error => {
                console.error('There was an error creating the survey!', error);
            });
    };

    return (
        <div>
            <h2>Create a Survey</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title:</label>
                    <input type="text" name="title" value={survey.title} onChange={handleSurveyChange} required />
                </div>
                <div>
                    <label>Description:</label>
                    <textarea name="description" value={survey.description} onChange={handleSurveyChange} required />
                </div>
                <div>
                    <label>Category:</label>
                    <input type="text" name="category" value={survey.category} onChange={handleSurveyChange} required />
                </div>
                <div>
                    <label>Deadline:</label>
                    <DatePicker selected={survey.deadline} onChange={handleDateChange} required />
                </div>
                <div>
                    <h3>Add Questions</h3>
                    <div>
                        <label>Question Title:</label>
                        <input type="text" name="title" value={question.title} onChange={handleQuestionChange} required />
                    </div>
                    <div>
                        <label>Question Description:</label>
                        <textarea name="description" value={question.description} onChange={handleQuestionChange} required />
                    </div>
                    <button type="button" onClick={addQuestion}>Add Question</button>
                </div>
                <button type="submit">Create Survey</button>
            </form>
            <div>
                <h3>Questions</h3>
                <ul>
                    {survey.questions.map((q, index) => (
                        <li key={index}>
                            <h4>{q.title}</h4>
                            <p>{q.description}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CreateSurvey;
Step 3: Update Backend
Update Schema and Routes in Express
Update Survey Schema:
javascript
Copy code
const surveySchema = new mongoose.Schema({
    title: String,
    description: String,
    questions: [
        {
            title: String,
            description: String,
            options: [String]
        }
    ],
    category: String,
    deadline: Date




    app.post('/api/surveys', (req, res) => {
      const survey = new Survey(req.body);
      survey.save()
          .then(() => res.json(survey))
          .catch(err => res.status(400).json('Error: ' + err));
  });
  
  app.get('/api/surveys', (req, res) => {
      Survey.find()
          .then(surveys => res.json(surveys))
          .catch(err => res.status(400).json('Error: ' + err));
  });



  src/components/SurveyList.js



  import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SurveyList = () => {
    const [surveys, setSurveys] = useState([]);

    useEffect(() => {
        axios.get('/api/surveys')
            .then(response => {
                setSurveys(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching the surveys!', error);
            });
    }, []);

    return (
        <div>
            <h2>Surveys</h2>
            <ul>
                {surveys.map(survey => (
                    <li key={survey._id}>
                        <h3>{survey.title}</h3>
                        <p>{survey.description}</p>
                        <p>Category: {survey.category}</p>
                        <p>Deadline: {new Date(survey.deadline).toLocaleDateString()}</p>
                        <h4>Questions:</h4>
                        <ul>
                            {survey.questions.map((q, index) => (
                                <li key={index}>
                                    <strong>{q.title}</strong>
                                    <p>{q.description}</p>
                                    <p>Options: {q.options.join(', ')}</p>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SurveyList;