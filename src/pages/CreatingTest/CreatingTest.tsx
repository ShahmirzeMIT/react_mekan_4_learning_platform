import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Modal,
  message,
  Table,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Select,
  Tag,
  Layout,
  Divider,
  Drawer,
  Badge,
  List,
  Avatar,
  Radio,
  Checkbox,
  Steps,
  Statistic,
  Empty,
  Alert,
  Descriptions
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  ReloadOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  FormOutlined,
  CopyOutlined,
  EyeOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  CodeOutlined
} from '@ant-design/icons';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { v4 as uuidv4 } from 'uuid';
import HtmlCodeShow from '../CreateClass/HtmlCodeShow';
import HtmlEditorComp from '../CreateClass/HtmlEditorComp';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

// Collection names
const COLLECTIONS = {
  EXAMS: 'platform_exams',
  CLASSES: 'platform_classes',
  RESULTS: 'platform_exam_results'
};

// Question types
const QuestionType = {
  OPEN_ENDED: 'open_ended',
  MULTIPLE_CHOICE: 'multiple_choice',
  CHECKBOX: 'checkbox',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer'
};

// Custom styles for preview (same as CreateClass)
const previewStyles = `
  .exam-preview {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    padding: 20px;
  }
  .exam-preview h1 {
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
    margin-top: 0;
    font-size: 28px;
  }
  .exam-preview h2 {
    color: #2c3e50;
    margin-top: 30px;
    font-size: 24px;
  }
  .exam-preview .info-box {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin: 20px 0;
  }
  .exam-preview img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    margin: 20px 0;
  }
  .exam-preview .question-box {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin: 20px 0;
    border-left: 4px solid #1890ff;
  }
  .exam-preview .options-list {
    list-style-type: none;
    padding: 0;
  }
  .exam-preview .options-list li {
    background: white;
    margin: 10px 0;
    padding: 12px;
    border-radius: 5px;
    border: 1px solid #e8e8e8;
  }
  .exam-preview .correct-answer {
    background: #f6ffed;
    border: 1px solid #b7eb8f;
  }
  .exam-preview blockquote {
    background: #2c3e50;
    color: white;
    padding: 20px;
    border-radius: 8px;
    font-style: italic;
    margin: 30px 0;
  }
  .exam-preview ul.custom-list {
    list-style-type: none;
    padding: 0;
  }
  .exam-preview ul.custom-list li {
    background: #e8f4f8;
    margin: 10px 0;
    padding: 12px;
    border-radius: 5px;
  }
  .exam-preview .image-grid {
    display: flex;
    gap: 20px;
    margin: 30px 0;
  }
  .exam-preview .image-item {
    flex: 1;
    text-align: center;
  }
  .exam-preview .image-item img {
    max-width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
    margin: 0;
  }
`;

// Main Component
export const CreatingTest = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isExamModalVisible, setIsExamModalVisible] = useState(false);
  const [isQuestionDrawerVisible, setIsQuestionDrawerVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [questionForm] = Form.useForm();
  
  // Exam state
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examClass, setExamClass] = useState(null);
  const [examDuration, setExamDuration] = useState(60);
  const [examPassingScore, setExamPassingScore] = useState(50);
  const [examStatus, setExamStatus] = useState('draft');
  const [questions, setQuestions] = useState([]);
  
  // Question form state
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState(QuestionType.MULTIPLE_CHOICE);
  const [questionPoints, setQuestionPoints] = useState(10);
  const [questionOptions, setQuestionOptions] = useState(['', '']);
  const [questionCorrectAnswer, setQuestionCorrectAnswer] = useState('');
  const [questionCorrectAnswers, setQuestionCorrectAnswers] = useState([]);
  const [questionImage, setQuestionImage] = useState('');

  // Fetch exams on mount with real-time updates
  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, []);

  const fetchExams = async () => {
    try {
      const examsRef = collection(db, COLLECTIONS.EXAMS);
      const q = query(examsRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const examsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          key: doc.id
        }));
        setExams(examsData);
      });

      return () => unsubscribe();
    } catch (error) {
      message.error('İmtahanlar yüklənərkən xəta: ' + error.message);
    }
  };

  const fetchClasses = async () => {
    try {
      const classesRef = collection(db, COLLECTIONS.CLASSES);
      const q = query(classesRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const classesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          key: doc.id
        }));
        setClasses(classesData);
      });

      return () => unsubscribe();
    } catch (error) {
      message.error('Siniflər yüklənərkən xəta: ' + error.message);
    }
  };

  const resetExamForm = () => {
    setExamTitle('');
    setExamDescription('');
    setExamClass(null);
    setExamDuration(60);
    setExamPassingScore(50);
    setExamStatus('draft');
    setQuestions([]);
    setCurrentStep(0);
  };

  const resetQuestionForm = () => {
    setQuestionText('');
    setQuestionType(QuestionType.MULTIPLE_CHOICE);
    setQuestionPoints(10);
    setQuestionOptions(['', '']);
    setQuestionCorrectAnswer('');
    setQuestionCorrectAnswers([]);
    setQuestionImage('');
    questionForm.resetFields();
  };

  const handleSaveExam = async () => {
    try {
      setLoading(true);

      if (!examTitle) {
        message.warning('İmtahan başlığını daxil edin');
        return;
      }

      if (!examClass) {
        message.warning('Sinif seçin');
        return;
      }

      if (questions.length === 0) {
        message.warning('Ən azı bir sual əlavə edin');
        return;
      }

      const totalPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);

      const examData = {
        title: examTitle,
        description: examDescription,
        classId: examClass,
        className: classes.find(c => c.id === examClass)?.name,
        duration: examDuration,
        passingScore: examPassingScore,
        status: examStatus,
        questions: questions,
        totalQuestions: questions.length,
        totalPoints: totalPoints,
        createdBy: 'currentUserId',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (editingExam) {
        await updateDoc(doc(db, COLLECTIONS.EXAMS, editingExam.id), {
          ...examData,
          updatedAt: Timestamp.now()
        });
        message.success('İmtahan uğurla yeniləndi');
      } else {
        await addDoc(collection(db, COLLECTIONS.EXAMS), examData);
        message.success('İmtahan uğurla yaradıldı');
      }

      setIsExamModalVisible(false);
      setEditingExam(null);
      resetExamForm();
    } catch (error) {
      console.error('Error saving exam:', error);
      message.error('Xəta baş verdi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    try {
      if (!questionText) {
        message.warning('Sual mətnini daxil edin');
        return;
      }

      // Validate based on question type
      if (questionType === QuestionType.MULTIPLE_CHOICE || questionType === QuestionType.CHECKBOX) {
        if (questionOptions.some(opt => !opt.trim())) {
          message.warning('Bütün variantları doldurun');
          return;
        }

        if (questionType === QuestionType.MULTIPLE_CHOICE && !questionCorrectAnswer) {
          message.warning('Düzgün cavab seçin');
          return;
        }

        if (questionType === QuestionType.CHECKBOX && questionCorrectAnswers.length === 0) {
          message.warning('Ən azı bir düzgün cavab seçin');
          return;
        }
      }

      const newQuestion = {
        id: editingQuestion?.id || uuidv4(),
        text: questionText,
        type: questionType,
        points: questionPoints,
        options: questionType === QuestionType.MULTIPLE_CHOICE || questionType === QuestionType.CHECKBOX 
          ? questionOptions.filter(opt => opt.trim())
          : [],
        correctAnswer: questionType === QuestionType.MULTIPLE_CHOICE || questionType === QuestionType.TRUE_FALSE
          ? questionCorrectAnswer
          : null,
        correctAnswers: questionType === QuestionType.CHECKBOX
          ? questionCorrectAnswers
          : [],
        image: questionImage || null,
        createdAt: Timestamp.now()
      };

      if (editingQuestion) {
        setQuestions(questions.map(q => 
          q.id === editingQuestion.id ? newQuestion : q
        ));
        message.success('Sual yeniləndi');
      } else {
        setQuestions([...questions, newQuestion]);
        message.success('Sual əlavə edildi');
      }

      setIsQuestionDrawerVisible(false);
      setEditingQuestion(null);
      resetQuestionForm();
    } catch (error) {
      console.error('Error adding question:', error);
      message.error('Xəta baş verdi: ' + error.message);
    }
  };

  const handleDeleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    message.success('Sual silindi');
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionText(question.text);
    setQuestionType(question.type);
    setQuestionPoints(question.points);
    
    if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.CHECKBOX) {
      setQuestionOptions(question.options || ['', '']);
    }
    
    if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
      setQuestionCorrectAnswer(question.correctAnswer || '');
    }
    
    if (question.type === QuestionType.CHECKBOX) {
      setQuestionCorrectAnswers(question.correctAnswers || []);
    }
    
    setQuestionImage(question.image || '');
    setIsQuestionDrawerVisible(true);
  };

  const showExamPreview = (exam) => {
    setSelectedExam(exam);
    setIsPreviewModalVisible(true);
  };

  // Render question type icon
  const getQuestionTypeIcon = (type) => {
    switch(type) {
      case QuestionType.OPEN_ENDED:
        return <FormOutlined style={{ color: '#faad14' }} />;
      case QuestionType.MULTIPLE_CHOICE:
        return <OrderedListOutlined style={{ color: '#52c41a' }} />;
      case QuestionType.CHECKBOX:
        return <UnorderedListOutlined style={{ color: '#1890ff' }} />;
      case QuestionType.TRUE_FALSE:
        return <SwapOutlined style={{ color: '#722ed1' }} />;
      case QuestionType.SHORT_ANSWER:
        return <FileTextOutlined style={{ color: '#eb2f96' }} />;
      default:
        return <QuestionCircleOutlined />;
    }
  };

  // Get question type label
  const getQuestionTypeLabel = (type) => {
    switch(type) {
      case QuestionType.OPEN_ENDED:
        return 'Açıq sual';
      case QuestionType.MULTIPLE_CHOICE:
        return 'Tək seçim';
      case QuestionType.CHECKBOX:
        return 'Çox seçim';
      case QuestionType.TRUE_FALSE:
        return 'Doğru/Yanlış';
      case QuestionType.SHORT_ANSWER:
        return 'Qısa cavab';
      default:
        return type;
    }
  };

  // Function to preview content with proper styling (like in CreateClass)
  const showContentPreview = (record) => {
    Modal.info({
      title: record.title,
      width: 900,
      content: (
        <div style={{ 
          maxHeight: '600px', 
          overflow: 'auto', 
          padding: '24px',
          background: '#fff',
          borderRadius: '8px'
        }}>
          <style>{previewStyles}</style>
          <div 
            className="exam-preview"
            dangerouslySetInnerHTML={{ __html: record.content }} 
          />
        </div>
      ),
      okText: 'Bağla',
      okButtonProps: {
        style: { background: '#1890ff' }
      }
    });
  };

  // Exams table columns
  const examColumns = [
    {
      title: 'Başlıq',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          <BookOutlined style={{ color: '#1890ff' }} />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Sinif',
      dataIndex: 'className',
      key: 'className',
      render: (text) => text || '-'
    },
    {
      title: 'Suallar',
      dataIndex: 'totalQuestions',
      key: 'totalQuestions',
      render: (count) => <Tag color="blue">{count} sual</Tag>
    },
    {
      title: 'Maksimum Bal',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
      render: (points) => <Tag color="green">{points} bal</Tag>
    },
    {
      title: 'Müddət',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => (
        <Space>
          <ClockCircleOutlined />
          <span>{duration} dəq</span>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          color={status === 'published' ? 'green' : status === 'draft' ? 'orange' : 'red'}
          text={status === 'published' ? 'Dərc edilib' : status === 'draft' ? 'Qaralama' : 'Arxiv'}
        />
      )
    },
    {
      title: 'Əməliyyatlar',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space>
          <Tooltip title="Önizləmə">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showExamPreview(record)}
            />
          </Tooltip>
          <Tooltip title="HTML Kodu">
            <Button
              type="text"
              icon={<CodeOutlined />}
              onClick={() => {
                Modal.info({
                  title: `${record.title} - HTML Kodu`,
                  width: 900,
                  content: (
                    <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                      <HtmlCodeShow
                        data={{
                          previewHtml: JSON.stringify(record, null, 2),
                          onChange: () => {}
                        }} 
                      />
                    </div>
                  ),
                  okText: 'Bağla'
                });
              }}
            />
          </Tooltip>
          <Tooltip title="Redaktə et">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingExam(record);
                setExamTitle(record.title);
                setExamDescription(record.description || '');
                setExamClass(record.classId);
                setExamDuration(record.duration || 60);
                setExamPassingScore(record.passingScore || 50);
                setExamStatus(record.status || 'draft');
                setQuestions(record.questions || []);
                setIsExamModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Sil">
            <Popconfirm
              title="Bu imtahanı silmək istədiyinizə əminsiniz?"
              onConfirm={async () => {
                try {
                  await deleteDoc(doc(db, COLLECTIONS.EXAMS, record.id));
                  message.success('İmtahan silindi');
                } catch (error) {
                  message.error('Xəta: ' + error.message);
                }
              }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', padding: '24px', background: '#f0f2f5' }}>
      {/* Header - Like CreateClass */}
      <div style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <Space align="center">
          <FormOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
          <Title level={3} style={{ margin: 0 }}>İmtahan Yaradılması</Title>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingExam(null);
            resetExamForm();
            setIsExamModalVisible(true);
          }}
          size="large"
        >
          Yeni İmtahan
        </Button>
      </div>

      {/* Exams Table */}
      <Card>
        <Table
          columns={examColumns}
          dataSource={exams}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Exam Preview Modal - Fixed like CreateClass */}
      <Modal
        title={selectedExam?.title}
        open={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setIsPreviewModalVisible(false)}>
            Bağla
          </Button>
        ]}
      >
        <style>{previewStyles}</style>
        <div className="exam-preview" style={{ maxHeight: '600px', overflow: 'auto' }}>
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Sinif">{selectedExam?.className}</Descriptions.Item>
            <Descriptions.Item label="Müddət">{selectedExam?.duration} dəqiqə</Descriptions.Item>
            <Descriptions.Item label="Sualların sayı">{selectedExam?.totalQuestions}</Descriptions.Item>
            <Descriptions.Item label="Maksimum bal">{selectedExam?.totalPoints}</Descriptions.Item>
            <Descriptions.Item label="Keçid balı">{selectedExam?.passingScore}%</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge 
                color={selectedExam?.status === 'published' ? 'green' : 'orange'}
                text={selectedExam?.status === 'published' ? 'Dərc edilib' : 'Qaralama'}
              />
            </Descriptions.Item>
          </Descriptions>

          <Divider>İmtahan Təsviri</Divider>
          
          {selectedExam?.description ? (
            <div dangerouslySetInnerHTML={{ __html: selectedExam.description }} />
          ) : (
            <Text type="secondary">Təsvir əlavə edilməyib</Text>
          )}

          <Divider>Suallar</Divider>

          {selectedExam?.questions?.map((question, index) => (
            <div key={question.id} className="question-box">
              <Title level={5}>
                Sual {index + 1} ({question.points} bal)
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {getQuestionTypeLabel(question.type)}
                </Tag>
              </Title>
              
              {/* Fixed: Use proper div with className and dangerouslySetInnerHTML */}
              <div 
                className="exam-preview-content"
                dangerouslySetInnerHTML={{ __html: question.text }} 
              />
              
              {question.image && (
                <img src={question.image} alt={`Sual ${index + 1}`} />
              )}

              {question.type === QuestionType.MULTIPLE_CHOICE && question.options && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>Variantlar:</Text>
                  <ul className="options-list">
                    {question.options.map((opt, i) => (
                      <li 
                        key={i}
                        className={opt === question.correctAnswer ? 'correct-answer' : ''}
                      >
                        <Radio checked={opt === question.correctAnswer} disabled>
                          {opt}
                          {opt === question.correctAnswer && (
                            <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                          )}
                        </Radio>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {question.type === QuestionType.CHECKBOX && question.options && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>Variantlar:</Text>
                  <ul className="options-list">
                    {question.options.map((opt, i) => (
                      <li 
                        key={i}
                        className={question.correctAnswers?.includes(opt) ? 'correct-answer' : ''}
                      >
                        <Checkbox checked={question.correctAnswers?.includes(opt)} disabled>
                          {opt}
                          {question.correctAnswers?.includes(opt) && (
                            <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                          )}
                        </Checkbox>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {question.type === QuestionType.TRUE_FALSE && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>Düzgün cavab:</Text>
                  <div>
                    <Tag color={question.correctAnswer === 'true' ? 'green' : 'red'}>
                      {question.correctAnswer === 'true' ? 'Doğru' : 'Yanlış'}
                    </Tag>
                  </div>
                </div>
              )}

              {question.type === QuestionType.OPEN_ENDED && (
                <Alert
                  message="Açıq sual"
                  description="Bu sualın cavabı əl ilə yoxlanılmalıdır."
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* Exam Creation/Edit Modal */}
      <Modal
        title={editingExam ? 'İmtahanı Redaktə Et' : 'Yeni İmtahan Yaradılması'}
        open={isExamModalVisible}
        onCancel={() => {
          setIsExamModalVisible(false);
          setEditingExam(null);
          resetExamForm();
        }}
        width={1000}
        footer={[
          <Button key="back" onClick={() => setIsExamModalVisible(false)}>
            Ləğv et
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSaveExam}
            loading={loading}
          >
            {editingExam ? 'Yenilə' : 'Yarat'}
          </Button>
        ]}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Əsas Məlumatlar" icon={<FileTextOutlined />} />
          <Step title="Suallar" icon={<QuestionCircleOutlined />} />
          <Step title="Yekun" icon={<CheckCircleOutlined />} />
        </Steps>

        {currentStep === 0 && (
          <div>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="İmtahan Başlığı" required>
                    <Input
                      placeholder="Məsələn: Riyaziyyat - I Mərhələ"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Sinif" required>
                    <Select
                      placeholder="Sinif seçin"
                      value={examClass}
                      onChange={setExamClass}
                      size="large"
                      showSearch
                      optionFilterProp="children"
                    >
                      {classes.map(cls => (
                        <Option key={cls.id} value={cls.id}>
                          {cls.name} - {cls.grade} {cls.subject}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Təsvir (HTML)">
                    <HtmlEditorComp
                      data={{
                        value: examDescription,
                        onChange: setExamDescription
                      }} 
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Müddət (dəqiqə)">
                    <Input
                      type="number"
                      value={examDuration}
                      onChange={(e) => setExamDuration(Number(e.target.value))}
                      min={5}
                      max={180}
                      suffix="dəq"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Keçid Balı (%)">
                    <Input
                      type="number"
                      value={examPassingScore}
                      onChange={(e) => setExamPassingScore(Number(e.target.value))}
                      min={0}
                      max={100}
                      suffix="%"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Status">
                    <Select value={examStatus} onChange={setExamStatus}>
                      <Option value="draft">Qaralama</Option>
                      <Option value="published">Dərc et</Option>
                      <Option value="archived">Arxivlə</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            <Divider />

            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="Sualların sayı" 
                  value={questions.length} 
                  prefix={<QuestionCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Ümumi bal" 
                  value={questions.reduce((sum, q) => sum + (q.points || 10), 0)} 
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Ortalama bal" 
                  value={questions.length > 0 
                    ? (questions.reduce((sum, q) => sum + (q.points || 10), 0) / questions.length).toFixed(1)
                    : 0
                  } 
                  prefix={<BarChartOutlined />}
                />
              </Col>
            </Row>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <div style={{ marginBottom: 24, textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingQuestion(null);
                  resetQuestionForm();
                  setIsQuestionDrawerVisible(true);
                }}
              >
                Sual Əlavə Et
              </Button>
            </div>

            {questions.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={questions}
                renderItem={(question, index) => (
                  <List.Item
                    key={question.id}
                    actions={[
                      <Tooltip title="Redaktə et">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditQuestion(question)}
                        />
                      </Tooltip>,
                      <Tooltip title="Sil">
                        <Popconfirm
                          title="Bu sualı silmək istədiyinizə əminsiniz?"
                          onConfirm={() => handleDeleteQuestion(question.id)}
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Tooltip>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ background: '#1890ff' }}>
                          {index + 1}
                        </Avatar>
                      }
                      title={
                        <Space>
                          {getQuestionTypeIcon(question.type)}
                          <Text strong>Sual {index + 1}</Text>
                          <Tag color="green">{question.points || 10} bal</Tag>
                          <Tag color="blue">{getQuestionTypeLabel(question.type)}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div 
                            dangerouslySetInnerHTML={{ __html: question.text }} 
                            style={{ marginBottom: 8 }}
                          />
                          
                          {question.type === QuestionType.MULTIPLE_CHOICE && question.options && (
                            <div>
                              <Text type="secondary">Variantlar:</Text>
                              <Radio.Group value={question.correctAnswer} disabled>
                                <Space direction="vertical">
                                  {question.options.map((opt, i) => (
                                    <Radio key={i} value={opt}>
                                      {opt}
                                      {opt === question.correctAnswer && (
                                        <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                                      )}
                                    </Radio>
                                  ))}
                                </Space>
                              </Radio.Group>
                            </div>
                          )}

                          {question.type === QuestionType.CHECKBOX && question.options && (
                            <div>
                              <Text type="secondary">Variantlar:</Text>
                              <Checkbox.Group value={question.correctAnswers} disabled>
                                <Space direction="vertical">
                                  {question.options.map((opt, i) => (
                                    <Checkbox key={i} value={opt}>
                                      {opt}
                                      {question.correctAnswers?.includes(opt) && (
                                        <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                                      )}
                                    </Checkbox>
                                  ))}
                                </Space>
                              </Checkbox.Group>
                            </div>
                          )}

                          {question.type === QuestionType.TRUE_FALSE && (
                            <div>
                              <Text type="secondary">Düzgün cavab:</Text>
                              <Tag color={question.correctAnswer === 'true' ? 'green' : 'red'}>
                                {question.correctAnswer === 'true' ? 'Doğru' : 'Yanlış'}
                              </Tag>
                            </div>
                          )}

                          {question.image && (
                            <div style={{ marginTop: 8 }}>
                              <img 
                                src={question.image} 
                                alt="Sual şəkli" 
                                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                              />
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Hələ sual əlavə edilməyib"
              >
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingQuestion(null);
                    resetQuestionForm();
                    setIsQuestionDrawerVisible(true);
                  }}
                >
                  İlk Sualı Əlavə Et
                </Button>
              </Empty>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 72, color: '#52c41a', marginBottom: 24 }} />
            <Title level={3}>İmtahan Hazırdır!</Title>
            <Paragraph>
              <Text strong>{examTitle}</Text> imtahanı uğurla hazırlandı.
            </Paragraph>
            <Paragraph>
              <Tag color="blue">{questions.length} sual</Tag>
              <Tag color="green">{questions.reduce((sum, q) => sum + (q.points || 10), 0)} bal</Tag>
              <Tag color="orange">{examDuration} dəqiqə</Tag>
            </Paragraph>
            <Alert
              message="Məlumat"
              description="İmtahanı yadda saxlamaq üçün 'Yarat' düyməsini klikləyin."
              type="info"
              showIcon
              style={{ maxWidth: 500, margin: '24px auto' }}
            />
          </div>
        )}

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            Geri
          </Button>
          <Button
            type="primary"
            onClick={() => {
              if (currentStep === 0) {
                if (!examTitle || !examClass) {
                  message.warning('Zəhmət olmasa bütün məlumatları doldurun');
                  return;
                }
              }
              if (currentStep === 1) {
                if (questions.length === 0) {
                  message.warning('Ən azı bir sual əlavə edin');
                  return;
                }
              }
              if (currentStep === 2) {
                handleSaveExam();
                return;
              }
              setCurrentStep(currentStep + 1);
            }}
          >
            {currentStep === 2 ? 'Tamamla' : 'İrəli'}
          </Button>
        </div>
      </Modal>

      {/* Question Drawer */}
      <Drawer
        title={editingQuestion ? 'Sualı Redaktə Et' : 'Yeni Sual Əlavə Et'}
        placement="right"
        width={800}
        onClose={() => {
          setIsQuestionDrawerVisible(false);
          setEditingQuestion(null);
          resetQuestionForm();
        }}
        open={isQuestionDrawerVisible}
        extra={
          <Space>
            <Button onClick={() => {
              setIsQuestionDrawerVisible(false);
              setEditingQuestion(null);
              resetQuestionForm();
            }}>
              Ləğv et
            </Button>
            <Button type="primary" onClick={handleAddQuestion}>
              {editingQuestion ? 'Yenilə' : 'Əlavə et'}
            </Button>
          </Space>
        }
      >
        <Form
          form={questionForm}
          layout="vertical"
        >
          <Form.Item label="Sual Tipi" required>
            <Select
              value={questionType}
              onChange={(value) => {
                setQuestionType(value);
                setQuestionOptions(['', '']);
                setQuestionCorrectAnswer('');
                setQuestionCorrectAnswers([]);
              }}
              size="large"
            >
              <Option value={QuestionType.MULTIPLE_CHOICE}>Tək seçim (Multiple Choice)</Option>
              <Option value={QuestionType.CHECKBOX}>Çox seçim (Checkbox)</Option>
              <Option value={QuestionType.OPEN_ENDED}>Açıq sual (Open Ended)</Option>
              <Option value={QuestionType.SHORT_ANSWER}>Qısa cavab (Short Answer)</Option>
              <Option value={QuestionType.TRUE_FALSE}>Doğru/Yanlış (True/False)</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Sual Balı" required>
            <Input
              type="number"
              value={questionPoints}
              onChange={(e) => setQuestionPoints(Number(e.target.value))}
              min={1}
              max={100}
              suffix="bal"
            />
          </Form.Item>

          <Form.Item label="Sual Mətni" required>
            <HtmlEditorComp 
              data={{
                value: questionText,
                onChange: setQuestionText
              }} 
            />
          </Form.Item>

          <Form.Item label="Şəkil URL (opsiyonel)">
            <Input
              placeholder="https://example.com/image.jpg"
              value={questionImage}
              onChange={(e) => setQuestionImage(e.target.value)}
            />
            {questionImage && (
              <div style={{ marginTop: 8 }}>
                <img 
                  src={questionImage} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4 }}
                />
              </div>
            )}
          </Form.Item>

          {(questionType === QuestionType.MULTIPLE_CHOICE || questionType === QuestionType.CHECKBOX) && (
            <>
              <Divider>Variantlar</Divider>
              {questionOptions.map((option, index) => (
                <Form.Item key={index} label={`Variant ${index + 1}`} required>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionOptions];
                      newOptions[index] = e.target.value;
                      setQuestionOptions(newOptions);
                    }}
                    placeholder={`Variant ${index + 1} mətnini daxil edin`}
                  />
                </Form.Item>
              ))}
              
              <Button
                type="dashed"
                onClick={() => setQuestionOptions([...questionOptions, ''])}
                icon={<PlusOutlined />}
                block
                style={{ marginBottom: 16 }}
              >
                Yeni Variant Əlavə Et
              </Button>

              {questionType === QuestionType.MULTIPLE_CHOICE && (
                <Form.Item label="Düzgün Cavab" required>
                  <Select
                    value={questionCorrectAnswer}
                    onChange={setQuestionCorrectAnswer}
                    placeholder="Düzgün cavabı seçin"
                  >
                    {questionOptions.filter(opt => opt.trim()).map((opt, i) => (
                      <Option key={i} value={opt}>{opt}</Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              {questionType === QuestionType.CHECKBOX && (
                <Form.Item label="Düzgün Cavablar" required>
                  <Checkbox.Group
                    value={questionCorrectAnswers}
                    onChange={setQuestionCorrectAnswers}
                  >
                    <Space direction="vertical">
                      {questionOptions.filter(opt => opt.trim()).map((opt, i) => (
                        <Checkbox key={i} value={opt}>{opt}</Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                </Form.Item>
              )}
            </>
          )}

          {questionType === QuestionType.TRUE_FALSE && (
            <Form.Item label="Düzgün Cavab" required>
              <Radio.Group
                value={questionCorrectAnswer}
                onChange={(e) => setQuestionCorrectAnswer(e.target.value)}
              >
                <Radio value="true">Doğru</Radio>
                <Radio value="false">Yanlış</Radio>
              </Radio.Group>
            </Form.Item>
          )}

          {(questionType === QuestionType.OPEN_ENDED || questionType === QuestionType.SHORT_ANSWER) && (
            <Alert
              message="Qeyd"
              description="Açıq sualların cavabları əl ilə yoxlanılmalıdır."
              type="info"
              showIcon
            />
          )}
        </Form>
      </Drawer>
    </Layout>
  );
};

export default CreatingTest;