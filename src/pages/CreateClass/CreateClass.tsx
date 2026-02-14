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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileOutlined,
  SaveOutlined,
  BookOutlined,
  EyeOutlined,
  ScheduleOutlined,
  TeamOutlined,
  ReadOutlined,
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
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import HtmlEditorComp from './HtmlEditorComp';
import HtmlCodeShow from './HtmlCodeShow';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Collection names with platform_ prefix
const COLLECTIONS = {
  CLASSES: 'platform_classes',
  LESSONS: 'platform_lessons'
};

// Custom styles for preview
const previewStyles = `
  .lesson-preview {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    padding: 20px;
  }
  .lesson-preview h1 {
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
    margin-top: 0;
    font-size: 28px;
  }
  .lesson-preview h2 {
    color: #2c3e50;
    margin-top: 30px;
    font-size: 24px;
  }
  .lesson-preview .info-box {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin: 20px 0;
  }
  .lesson-preview img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    margin: 20px 0;
  }
  .lesson-preview ul.custom-list {
    list-style-type: none;
    padding: 0;
  }
  .lesson-preview ul.custom-list li {
    background: #e8f4f8;
    margin: 10px 0;
    padding: 12px;
    border-radius: 5px;
  }
  .lesson-preview .image-grid {
    display: flex;
    gap: 20px;
    margin: 30px 0;
  }
  .lesson-preview .image-item {
    flex: 1;
    text-align: center;
  }
  .lesson-preview .image-item img {
    max-width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
    margin: 0;
  }
  .lesson-preview blockquote {
    background: #2c3e50;
    color: white;
    padding: 20px;
    border-radius: 8px;
    font-style: italic;
    margin: 30px 0;
  }
`;

// Main Component
export const CreateClass = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isClassModalVisible, setIsClassModalVisible] = useState(false);
  const [isLessonDrawerVisible, setIsLessonDrawerVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [lessonForm] = Form.useForm();
  const [lessonContent, setLessonContent] = useState('');

  // Fetch classes on component mount with real-time updates
  useEffect(() => {
    const classesRef = collection(db, COLLECTIONS.CLASSES);
    const q = query(classesRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        key: doc.id
      }));
      setClasses(classesData);
    }, (error) => {
      message.error('Error fetching classes: ' + error.message);
    });

    return () => unsubscribe();
  }, []);

  // Fetch lessons with real-time updates when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setLessons([]);
      return;
    }

    const lessonsRef = collection(db, COLLECTIONS.LESSONS);
    const q = query(
      lessonsRef,
      where('classId', '==', selectedClass.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lessonsData = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        ...doc.data(),
        key: doc.id,
        sno: index + 1
      }));
      setLessons(lessonsData);
    }, (error) => {
      console.error('Error fetching lessons:', error);
      message.error('Error fetching lessons: ' + error.message);
    });

    return () => unsubscribe();
  }, [selectedClass]);

  const handleCreateClass = async (values) => {
    try {
      setLoading(true);
      const classData = {
        ...values,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lessonCount: 0,
        status: 'active'
      };

      if (editingClass) {
        await updateDoc(doc(db, COLLECTIONS.CLASSES, editingClass.id), {
          ...classData,
          updatedAt: Timestamp.now()
        });
        message.success('Class updated successfully');
      } else {
        await addDoc(collection(db, COLLECTIONS.CLASSES), classData);
        message.success('Class created successfully');
      }

      setIsClassModalVisible(false);
      form.resetFields();
      setEditingClass(null);
    } catch (error) {
      message.error('Error saving class: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, COLLECTIONS.CLASSES, classId));
      message.success('Class deleted successfully');
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
      }
    } catch (error) {
      message.error('Error deleting class: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async (values) => {
    try {
      setLoading(true);
      
      // Validate content
      if (!lessonContent || lessonContent === '<p><br></p>' || lessonContent === '<p></p>') {
        message.error('Please add lesson content');
        setLoading(false);
        return;
      }

      const lessonData = {
        title: values.title,
        content: lessonContent,
        classId: selectedClass.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: values.status || 'draft'
      };

      if (editingLesson) {
        await updateDoc(doc(db, COLLECTIONS.LESSONS, editingLesson.id), {
          ...lessonData,
          updatedAt: Timestamp.now()
        });
        message.success('Lesson updated successfully');
      } else {
        await addDoc(collection(db, COLLECTIONS.LESSONS), lessonData);
        
        // Update class lesson count
        const classRef = doc(db, COLLECTIONS.CLASSES, selectedClass.id);
        await updateDoc(classRef, {
          lessonCount: lessons.length + 1,
          updatedAt: Timestamp.now()
        });
        
        message.success('Lesson created successfully');
      }

      setIsLessonDrawerVisible(false);
      lessonForm.resetFields();
      setLessonContent('');
      setEditingLesson(null);
    } catch (error) {
      message.error('Error saving lesson: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, COLLECTIONS.LESSONS, lessonId));
      
      // Update class lesson count
      const classRef = doc(db, COLLECTIONS.CLASSES, selectedClass.id);
      await updateDoc(classRef, {
        lessonCount: lessons.length - 1,
        updatedAt: Timestamp.now()
      });
      
      message.success('Lesson deleted successfully');
    } catch (error) {
      message.error('Error deleting lesson: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openLessonDrawer = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      lessonForm.setFieldsValue({
        title: lesson.title,
        status: lesson.status
      });
      setLessonContent(lesson.content || '');
    } else {
      setEditingLesson(null);
      lessonForm.resetFields();
      setLessonContent('');
    }
    setIsLessonDrawerVisible(true);
  };

  // Function to preview content with proper styling
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
            className="lesson-preview"
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

  // Lessons Table Columns
  const lessonColumns = [
    {
      title: '№',
      dataIndex: 'sno',
      key: 'sno',
      width: 60,
      align: 'center'
    },
    {
      title: 'Dərsin Başlığı',
      dataIndex: 'title',
      key: 'title',
      render: (text) => (
        <Space>
          <ReadOutlined style={{ color: '#1890ff' }} />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status) => {
        const color = status === 'published' ? 'green' : status === 'draft' ? 'orange' : 'default';
        return (
          <Badge 
            color={color}
            text={status === 'published' ? 'Dərc edilib' : status === 'draft' ? 'Qaralama' : 'Arxiv'} 
          />
        );
      }
    },
    {
      title: 'Yaradılma Tarixi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => date ? new Date(date.toDate()).toLocaleDateString('az-AZ') : '-'
    },
    {
      title: 'Əməliyyatlar',
      key: 'actions',
      width: 220,
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Məzmunu göstər">
            <Button 
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showContentPreview(record)}
            />
          </Tooltip>
          <Tooltip title="HTML kodu göstər">
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
                          previewHtml: record.content,
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
              onClick={() => openLessonDrawer(record)}
            />
          </Tooltip>
          <Tooltip title="Sil">
            <Popconfirm
              title="Bu dərsi silmək istədiyinizə əminsiniz?"
              onConfirm={() => handleDeleteLesson(record.id)}
              okText="Bəli"
              cancelText="Xeyr"
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
      {/* Header */}
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
          <BookOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
          <Title level={3} style={{ margin: 0 }}>Dərslərin İdarə Edilməsi</Title>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingClass(null);
            form.resetFields();
            setIsClassModalVisible(true);
          }}
          size="large"
        >
          Yeni Sinif Yarat
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Classes List */}
        <Col xs={24} md={8}>
          <Card 
            title={
              <Space>
                <TeamOutlined />
                <span>Siniflər</span>
              </Space>
            }
            extra={<Tag color="blue">{classes.length} sinif</Tag>}
            style={{ 
              height: 'calc(100vh - 200px)', 
              overflow: 'auto',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
            bodyStyle={{ padding: '12px' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={classes}
              loading={loading}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: selectedClass?.id === item.id ? '#e6f7ff' : 'white',
                    border: selectedClass?.id === item.id ? '1px solid #1890ff' : '1px solid #f0f0f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onClick={() => setSelectedClass(item)}
                  actions={[
                    <Tooltip title="Redaktə et">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClass(item);
                          form.setFieldsValue(item);
                          setIsClassModalVisible(true);
                        }}
                      />
                    </Tooltip>,
                    <Tooltip title="Sil">
                      <Popconfirm
                        title="Bu sinfi silmək istədiyinizə əminsiniz?"
                        onConfirm={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(item.id);
                        }}
                        okText="Bəli"
                        cancelText="Xeyr"
                      >
                        <Button 
                          type="text" 
                          size="small"
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<BookOutlined />} 
                        style={{ 
                          background: selectedClass?.id === item.id ? '#1890ff' : '#f0f0f0',
                          color: selectedClass?.id === item.id ? 'white' : '#595959'
                        }} 
                      />
                    }
                    title={<Text strong>{item.name}</Text>}
                    description={
                      <Space size={[0, 4]} wrap>
                        {item.grade && <Tag color="cyan">{item.grade}</Tag>}
                        {item.subject && <Tag color="purple">{item.subject}</Tag>}
                        <Tag color="blue">{item.lessonCount || 0} dərs</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Right Column - Lessons Table */}
        <Col xs={24} md={16}>
          <Card 
            title={
              <Space>
                <ScheduleOutlined />
                <span>
                  {selectedClass 
                    ? `Dərslər - ${selectedClass.name}` 
                    : 'Dərslər (Sinif seçin)'}
                </span>
              </Space>
            }
            extra={
              selectedClass ? (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openLessonDrawer()}
                >
                  Yeni Dərs
                </Button>
              ) : null
            }
            style={{ 
              height: 'calc(100vh - 200px)', 
              overflow: 'auto',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            {selectedClass ? (
              <Table
                columns={lessonColumns}
                dataSource={lessons}
                rowKey="id"
                loading={loading}
                pagination={{ 
                  pageSize: 8,
                  showTotal: (total) => `Cəmi ${total} dərs`
                }}
                size="middle"
                bordered
                locale={{
                  emptyText: (
                    <div style={{ padding: '48px' }}>
                      <FileOutlined style={{ fontSize: 48, color: '#ccc' }} />
                      <p style={{ marginTop: '16px', color: '#999' }}>
                        Hələ dərs yoxdur. "Yeni Dərs" düyməsini klikləyin.
                      </p>
                    </div>
                  )
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 48px' }}>
                <TeamOutlined style={{ fontSize: 64, color: '#ccc' }} />
                <Title level={4} type="secondary" style={{ marginTop: '16px' }}>
                  Sinif Seçin
                </Title>
                <Text type="secondary">
                  Dərsləri görmək üçün sol paneldən bir sinif seçin
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Class Modal */}
      <Modal
        title={editingClass ? 'Sinifi Redaktə Et' : 'Yeni Sinif Yarat'}
        open={isClassModalVisible}
        onCancel={() => {
          setIsClassModalVisible(false);
          form.resetFields();
          setEditingClass(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateClass}
        >
          <Form.Item
            name="name"
            label="Sinif Adı"
            rules={[{ required: true, message: 'Sinif adını daxil edin' }]}
          >
            <Input placeholder="Məsələn: 10A, Riyaziyyat 101" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Təsvir"
          >
            <TextArea rows={4} placeholder="Sinif haqqında qısa məlumat" />
          </Form.Item>

          <Form.Item
            name="grade"
            label="Sinif Səviyyəsi"
          >
            <Input placeholder="Məsələn: 10-cu sinif, Başlanğıc" />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Fənn"
          >
            <Input placeholder="Məsələn: Riyaziyyat, Fizika, Tarix" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingClass ? 'Yenilə' : 'Yarat'}
              </Button>
              <Button onClick={() => setIsClassModalVisible(false)}>
                Ləğv Et
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Lesson Drawer with HtmlEditorComp */}
      <Drawer
        title={editingLesson ? 'Dərsi Redaktə Et' : 'Yeni Dərs Yarat'}
        placement="right"
        width={1200}
        onClose={() => {
          setIsLessonDrawerVisible(false);
          lessonForm.resetFields();
          setLessonContent('');
          setEditingLesson(null);
        }}
        open={isLessonDrawerVisible}
        extra={
          <Space>
            <Button onClick={() => {
              setIsLessonDrawerVisible(false);
              lessonForm.resetFields();
              setLessonContent('');
              setEditingLesson(null);
            }}>
              Ləğv Et
            </Button>
            <Button 
              type="primary" 
              onClick={() => lessonForm.submit()} 
              loading={loading}
              icon={<SaveOutlined />}
            >
              {editingLesson ? 'Yenilə' : 'Yarat'}
            </Button>
          </Space>
        }
      >
        <Form
          form={lessonForm}
          layout="vertical"
          onFinish={handleCreateLesson}
        >
          <Form.Item
            name="title"
            label="Dərsin Başlığı"
            rules={[{ required: true, message: 'Dərsin başlığını daxil edin' }]}
          >
            <Input placeholder="Dərsin başlığı" size="large" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="draft"
          >
            <Select>
              <Option value="draft">Qaralama</Option>
              <Option value="published">Dərc Edilib</Option>
              <Option value="archived">Arxivləşdirilib</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Dərsin Məzmunu"
            required
            help="HTML editoru ilə məzmun yaradın"
          >
            <HtmlEditorComp 
              data={{
                value: lessonContent,
                onChange: setLessonContent
              }} 
            />
          </Form.Item>

          <Divider>Canlı Önizləmə</Divider>
          
          <Card
            title="Önizləmə"
            bordered
            style={{ marginBottom: 24 }}
            bodyStyle={{
              padding: 0,
              background: "#fff",
              maxHeight: "400px",
              overflow: "auto"
            }}
          >
            <style>{previewStyles}</style>
            <div
              className="lesson-preview"
              dangerouslySetInnerHTML={{ __html: lessonContent }}
            />
          </Card>

          <Divider>HTML Kodu</Divider>
          
          <Card
            title="HTML Kodu"
            bordered
            style={{ marginBottom: 24 }}
          >
            <HtmlCodeShow 
              data={{
                previewHtml: lessonContent,
                onChange: setLessonContent
              }} 
            />
          </Card>
        </Form>
      </Drawer>
    </Layout>
  );
};

export default CreateClass;