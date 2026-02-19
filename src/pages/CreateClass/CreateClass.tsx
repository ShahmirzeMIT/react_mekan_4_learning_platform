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
  InputNumber,
  Alert,
  Steps,
  Checkbox,
  Radio,
  Spin,
  Progress,
  Tabs,
  Image,
  Upload,
  Statistic,
  Empty,
  Progress as AntProgress
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
  CodeOutlined,
  DragOutlined,
  WarningOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  GlobalOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  PictureOutlined,
  UploadOutlined,
  FilePdfOutlined,
  LeftOutlined,
  RightOutlined,
  FolderOutlined,
  FileAddOutlined,
  ExportOutlined,
  ImportOutlined,
  FilterOutlined,
  ReloadOutlined,
  InboxOutlined,
  PaperClipOutlined,
  LinkOutlined
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
import { db, storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import HtmlEditorComp from './HtmlEditorComp';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;
const { TabPane } = Tabs;
const { Dragger } = Upload;

// Collection names with platform_ prefix
const COLLECTIONS = {
  CLASSES: 'platform_classes',
  LESSONS: 'platform_lessons',
  PDF_DOCUMENTS: 'platform_pdfs' // This matches your screenshot
};

// Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Şəkil URL-ləri üçün placeholder (picsum photos - pulsuz şəkillər)
const getRandomImageUrl = (width = 800, height = 400, id = 1) => {
  return `https://picsum.photos/${width}/${height}?random=${id}`;
};

// Sadə və öyrədici dərs formatı - FOKUS DƏRS + ŞƏKİLLƏR
const getLessonHTMLTemplate = (title, content, examples, exercises, keywords, images = []) => {
  // Şəkilləri HTML-ə əlavə et
  const imagesHTML = images.length > 0 ? `
    <h2 style="font-size: 22px; color: #2c3e50; margin-top: 30px;">Şəkilli İzahlar</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0;">
      ${images.map((img, idx) => `
        <div style="flex: 1; min-width: 300px; text-align: center;">
          <img src="${img.url}" alt="${img.alt || 'Şəkil'}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          ${img.caption ? `<p style="margin-top: 8px; color: #666; font-style: italic;">${img.caption}</p>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
    <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
      
      <h1 style="font-size: 28px; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 0;">${title}</h1>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
        <strong style="color: #2c3e50;">📚 Bu dərsdə öyrənəcəksiniz:</strong>
        <ul style="margin-top: 10px; padding-left: 20px;">
          <li>${content.substring(0, 150)}...</li>
        </ul>
      </div>
      
      <h2 style="font-size: 22px; color: #2c3e50; margin-top: 30px;">Dərsin Məzmunu</h2>
      <div style="background: white; padding: 15px; border-radius: 5px;">
        ${content}
      </div>
      
      ${imagesHTML}
      
      ${examples ? `
        <h2 style="font-size: 22px; color: #2c3e50; margin-top: 30px;">Nümunələr</h2>
        <div style="background-color: #f0f9f0; padding: 15px; border-radius: 5px; border-left: 4px solid #27ae60;">
          <strong style="color: #27ae60;">📝 Nümunələr:</strong>
          <div style="margin-top: 10px;">${examples}</div>
        </div>
      ` : ''}
      
      ${exercises ? `
        <h2 style="font-size: 22px; color: #2c3e50; margin-top: 30px;">Tapşırıqlar</h2>
        <div style="background-color: #f0f5ff; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db;">
          <strong style="color: #3498db;">✍️ Tapşırıqlar:</strong>
          <div style="margin-top: 10px;">${exercises}</div>
        </div>
      ` : ''}
      
      ${keywords && keywords.length > 0 ? `
        <h2 style="font-size: 22px; color: #2c3e50; margin-top: 30px;">Açar Sözlər</h2>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
          ${keywords.map(k => `<span style="display: inline-block; background: #e9ecef; padding: 5px 10px; margin: 5px; border-radius: 3px; font-size: 14px;">${k}</span>`).join('')}
        </div>
      ` : ''}
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
        <p>Bu dərs AI tərəfindən yaradılıb və öyrənmək üçün nəzərdə tutulub.</p>
      </div>
    </div>
  `;
};

// Multi PDF Import Component
const MultiPDFImportModal = ({ visible, onCancel, onSuccess, classId }) => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedPdfs, setUploadedPdfs] = useState([]);
  const [pdfError, setPdfError] = useState('');

  const handleFileUpload = async (file) => {
    // Check if file already exists in the list
    if (pdfFiles.some(f => f.name === file.name && f.size === file.size)) {
      message.warning(`${file.name} artıq əlavə edilib`);
      return false;
    }

    setPdfFiles(prev => [...prev, file]);
    return false;
  };

  const uploadAllPDFs = async () => {
    if (pdfFiles.length === 0) {
      message.warning('Zəhmət olmasa PDF fayllarını seçin');
      return;
    }

    if (!classId) {
      message.warning('Sinif ID tapılmadı');
      return;
    }

    setUploading(true);
    setUploadedPdfs([]);
    setPdfError('');

    const uploaded = [];
    const progress = {};

    try {
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        
        try {
          // Update progress for this file
          progress[file.name] = 0;
          setUploadProgress({ ...progress });

          // Upload to Firebase Storage
          const fileName = `pdfs/${classId}/${Date.now()}_${file.name}`;
          const storageRef = ref(storage, fileName);
          
          // Simulate progress
          const progressInterval = setInterval(() => {
            progress[file.name] = Math.min(90, (progress[file.name] || 0) + 10);
            setUploadProgress({ ...progress });
          }, 200);

          await uploadBytes(storageRef, file);
          
          clearInterval(progressInterval);
          progress[file.name] = 100;
          setUploadProgress({ ...progress });

          const url = await getDownloadURL(storageRef);

          // Save metadata to Firestore
          const pdfDocData = {
            classId: classId,
            fileName: file.name,
            fileUrl: url,
            fileSize: file.size,
            fileType: file.type,
            createdAt: Timestamp.now(),
            status: 'active'
          };

          const docRef = await addDoc(collection(db, COLLECTIONS.PDF_DOCUMENTS), pdfDocData);
          
          uploaded.push({
            id: docRef.id,
            ...pdfDocData
          });

          setUploadedPdfs([...uploaded]);

        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          message.error(`${file.name} yüklənərkən xəta: ${fileError.message}`);
        }
      }

      if (uploaded.length > 0) {
        message.success(`${uploaded.length} PDF uğurla yükləndi`);
        onSuccess(uploaded);
        
        // Reset state
        setPdfFiles([]);
        setUploadProgress({});
        setUploadedPdfs([]);
        onCancel();
      } else {
        message.error('Heç bir PDF yüklənə bilmədi');
      }

    } catch (error) {
      console.error('Error in batch upload:', error);
      setPdfError(error.message);
      message.error('PDF-lər yüklənərkən xəta: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileToRemove) => {
    setPdfFiles(prev => prev.filter(f => f.name !== fileToRemove.name || f.size !== fileToRemove.size));
  };

  const getTotalSize = () => {
    return pdfFiles.reduce((total, file) => total + file.size, 0);
  };

  return (
    <Modal
      title={
        <Space>
          <FilePdfOutlined style={{ color: '#ff4d4f' }} />
          <span>Çoxlu PDF Yüklə</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={uploading}>
          Ləğv Et
        </Button>,
        <Button
          key="upload"
          type="primary"
          icon={<UploadOutlined />}
          onClick={uploadAllPDFs}
          loading={uploading}
          disabled={pdfFiles.length === 0}
          style={{ background: '#ff4d4f', borderColor: '#ff4d4f' }}
        >
          {pdfFiles.length > 0 ? `${pdfFiles.length} PDF-i Yüklə` : 'PDF Yüklə'}
        </Button>
      ]}
    >
      <Spin spinning={uploading}>
        {pdfError && (
          <Alert
            message="Xəta"
            description={pdfError}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setPdfError('')}
          />
        )}

        <Card bordered={false}>
          <Dragger
            name="files"
            multiple={true}
            accept=".pdf"
            beforeUpload={handleFileUpload}
            showUploadList={false}
            disabled={uploading}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">PDF fayllarını seçin və ya sürüşdürün</p>
            <p className="ant-upload-hint">
              Birdən çox PDF seçə bilərsiniz. Maksimum fayl ölçüsü: 50MB
            </p>
          </Dragger>

          {pdfFiles.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Divider orientation="left">
                <Space>
                  <PaperClipOutlined />
                  Seçilmiş fayllar ({pdfFiles.length})
                </Space>
              </Divider>
              
              <List
                size="small"
                dataSource={pdfFiles}
                renderItem={(file, index) => (
                  <List.Item
                    actions={[
                      !uploading && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeFile(file)}
                        />
                      )
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FilePdfOutlined style={{ color: '#ff4d4f' }} />}
                      title={file.name}
                      description={
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Ölçü: {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Text>
                          {uploadProgress[file.name] !== undefined && (
                            <AntProgress 
                              percent={uploadProgress[file.name]} 
                              size="small" 
                              showInfo={false}
                              strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                              }}
                            />
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />

              <Divider />
              
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Fayl sayı"
                    value={pdfFiles.length}
                    suffix="fayl"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Ümumi ölçü"
                    value={(getTotalSize() / 1024 / 1024).toFixed(2)}
                    suffix="MB"
                  />
                </Col>
              </Row>
            </div>
          )}

          {uploadedPdfs.length > 0 && (
            <Alert
              message="Yükləndi"
              description={`${uploadedPdfs.length} PDF uğurla yükləndi`}
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      </Spin>
    </Modal>
  );
};

// PDF List Component with enhanced features
const PDFListDrawer = ({ visible, onClose, pdfs, onViewPDF, onDeletePDF, onRefresh }) => {
  const [selectedPDFs, setSelectedPDFs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDeleteSelected = async () => {
    if (selectedPDFs.length === 0) return;
    
    Modal.confirm({
      title: 'PDF-ləri sil',
      content: `${selectedPDFs.length} PDF sənədini silmək istədiyinizə əminsiniz?`,
      okText: 'Bəli',
      cancelText: 'Xeyr',
      onOk: async () => {
        setLoading(true);
        try {
          for (const pdfId of selectedPDFs) {
            await onDeletePDF(pdfId);
          }
          message.success(`${selectedPDFs.length} PDF silindi`);
          setSelectedPDFs([]);
          onRefresh();
        } catch (error) {
          message.error('Xəta baş verdi: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <Drawer
      title={
        <Space>
          <FilePdfOutlined style={{ color: '#ff4d4f' }} />
          <span>PDF Sənədlər ({pdfs.length})</span>
        </Space>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      extra={
        <Space>
          {selectedPDFs.length > 0 && (
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={handleDeleteSelected}
              loading={loading}
            >
              {selectedPDFs.length} sil
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            Yenilə
          </Button>
        </Space>
      }
    >
      {pdfs.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Bu sinifə aid PDF sənəd yoxdur"
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={pdfs}
          loading={loading}
          renderItem={(pdf) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => onViewPDF(pdf)}
                >
                  Bax
                </Button>,
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  href={pdf.fileUrl}
                  target="_blank"
                >
                  Yüklə
                </Button>,
                <Popconfirm
                  title="Bu PDF-i silmək istədiyinizə əminsiniz?"
                  onConfirm={() => onDeletePDF(pdf.id)}
                  okText="Bəli"
                  cancelText="Xeyr"
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                  >
                    Sil
                  </Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Checkbox 
                    checked={selectedPDFs.includes(pdf.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPDFs([...selectedPDFs, pdf.id]);
                      } else {
                        setSelectedPDFs(selectedPDFs.filter(id => id !== pdf.id));
                      }
                    }}
                  />
                }
                title={
                  <Space>
                    <FilePdfOutlined style={{ color: '#ff4d4f' }} />
                    <Text strong>{pdf.fileName}</Text>
                    {pdf.fileSize > 10 * 1024 * 1024 && (
                      <Tag color="orange">Böyük</Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Ölçü: {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Yüklənmə tarixi: {pdf.createdAt ? new Date(pdf.createdAt.toDate()).toLocaleDateString('az-AZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Sinif ID: {pdf.classId}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};

// Main Component
export const CreateClass = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [pdfDocuments, setPdfDocuments] = useState([]);
  const [isClassModalVisible, setIsClassModalVisible] = useState(false);
  const [isLessonDrawerVisible, setIsLessonDrawerVisible] = useState(false);
  const [isAIGeneratorVisible, setIsAIGeneratorVisible] = useState(false);
  const [isPDFImportVisible, setIsPDFImportVisible] = useState(false);
  const [isPDFListVisible, setIsPDFListVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const [form] = Form.useForm();
  const [lessonForm] = Form.useForm();
  const [lessonContent, setLessonContent] = useState('');
  const [tableLoading, setTableLoading] = useState(false);

  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLessonCount, setAiLessonCount] = useState(3);
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiIncludeExamples, setAiIncludeExamples] = useState(true);
  const [aiIncludeExercises, setAiIncludeExercises] = useState(true);
  const [aiIncludeImages, setAiIncludeImages] = useState(true);
  const [aiLanguage, setAiLanguage] = useState('az');
  const [aiLessonType, setAiLessonType] = useState('theory');
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedLessons, setGeneratedLessons] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);

  // Fetch classes on component mount
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

  // Update selected class when ID changes
  useEffect(() => {
    if (selectedClassId && classes.length > 0) {
      const foundClass = classes.find(c => c.id === selectedClassId);
      setSelectedClass(foundClass || null);
    } else {
      setSelectedClass(null);
    }
  }, [selectedClassId, classes]);

  // Fetch PDF documents when class is selected - FIXED VERSION
  const fetchPDFs = () => {
    if (!selectedClassId) {
      setPdfDocuments([]);
      return () => {};
    }

    console.log('Fetching PDFs for class:', selectedClassId);
    
    const pdfRef = collection(db, COLLECTIONS.PDF_DOCUMENTS);
    
    // Simple query without orderBy first to avoid index issues
    const q = query(
      pdfRef,
      where('classId', '==', selectedClassId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('PDF snapshot received:', snapshot.docs.length);
      const pdfData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort manually by createdAt
      const sortedData = pdfData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });
      
      console.log('PDF data:', sortedData);
      setPdfDocuments(sortedData);
    }, (error) => {
      console.error('Error fetching PDFs:', error);
      message.error('PDF-lər yüklənərkən xəta: ' + error.message);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = fetchPDFs();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedClassId]);

  // Fetch lessons when class is selected
  useEffect(() => {
    if (!selectedClassId) {
      setLessons([]);
      return;
    }

    setTableLoading(true);
    const lessonsRef = collection(db, COLLECTIONS.LESSONS);
    
    try {
      // First try with orderBy
      const q = query(
        lessonsRef,
        where('classId', '==', selectedClassId),
        orderBy('order', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const lessonsData = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          ...doc.data(),
          key: doc.id,
          sno: index + 1
        }));
        setLessons(lessonsData);
        setIndexBuilding(false);
        setTableLoading(false);
      }, (error) => {
        if (error.message.includes('index is currently building')) {
          setIndexBuilding(true);
          // Fallback query without orderBy
          const fallbackQuery = query(
            lessonsRef,
            where('classId', '==', selectedClassId)
          );
          
          const fallbackUnsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
            const lessonsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              key: doc.id
            }));
            
            const sortedData = lessonsData
              .sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                  return a.order - b.order;
                }
                if (a.order !== undefined) return -1;
                if (b.order !== undefined) return 1;
                return (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0);
              })
              .map((item, index) => ({ ...item, sno: index + 1 }));
              
            setLessons(sortedData);
            setTableLoading(false);
          }, (fallbackError) => {
            console.error('Error fetching lessons:', fallbackError);
            message.error('Error fetching lessons: ' + fallbackError.message);
            setTableLoading(false);
          });
          
          return fallbackUnsubscribe;
        } else {
          console.error('Error fetching lessons:', error);
          message.error('Error fetching lessons: ' + error.message);
          setTableLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up lessons listener:', error);
      message.error('Error setting up lessons listener: ' + error.message);
      setTableLoading(false);
    }
  }, [selectedClassId]);

  const handleClassChange = (value) => {
    console.log('Class changed to:', value);
    setSelectedClassId(value);
  };

  const handlePDFSuccess = (pdfsData) => {
    console.log('PDFs uploaded successfully:', pdfsData);
    message.success(`${pdfsData.length} PDF uğurla əlavə edildi`);
    setIsPDFImportVisible(false);
  };

  const handleDeletePDF = async (pdfId) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PDF_DOCUMENTS, pdfId));
      message.success('PDF silindi');
      return true;
    } catch (error) {
      message.error('PDF silinərkən xəta: ' + error.message);
      throw error;
    }
  };

  const showPDFPreview = (pdf) => {
    Modal.info({
      title: pdf.fileName,
      width: 900,
      content: (
        <div style={{ padding: '20px', height: '600px' }}>
          <iframe
            src={pdf.fileUrl}
            width="100%"
            height="100%"
            title={pdf.fileName}
            style={{ border: 'none' }}
          />
        </div>
      ),
      okText: 'Bağla',
      okButtonProps: {
        style: { background: '#1890ff' }
      },
      maskClosable: true,
      width: 1000
    });
  };

  // Generate lessons using Gemini AI
  const generateLessonsWithAI = async () => {
    if (!aiPrompt) {
      message.warning('Zəhmət olmasa dərs mövzusunu daxil edin');
      return;
    }

    if (!selectedClassId) {
      message.warning('Zəhmət olmasa əvvəlcə bir sinif seçin');
      return;
    }

    setAiGenerating(true);
    setAiProgress(0);
    setGeneratedLessons([]);

    try {
      const difficultyText = aiDifficulty === 'easy' ? 'asan' : aiDifficulty === 'medium' ? 'orta' : 'çətin';
      const languageText = aiLanguage === 'az' ? 'Azərbaycan' : aiLanguage === 'en' ? 'İngilis' : 'Rus';
      const lessonTypeText = aiLessonType === 'theory' ? 'nəzəri' : aiLessonType === 'practice' ? 'praktik' : 'qarışıq';

      const prompt = `
        Mənə ${aiLessonCount} ədəd ${difficultyText} çətinlik səviyyəsində, ${lessonTypeText} tipli dərs yaradın.
        Mövzu: ${aiPrompt}
        Sinif: ${selectedClass?.name || 'Ümumi'}
        Dil: ${languageText}
        
        Hər dərs aşağıdakı struktura uyğun olmalıdır:
        
        1. Başlıq: Qısa və aydın
        2. Məzmun: 500-800 söz, aydın izah, sadə dil
        3. Nümunələr: ${aiIncludeExamples ? '3-5 real nümunə' : 'yox'}
        4. Tapşırıqlar: ${aiIncludeExercises ? '3-5 tapşırıq' : 'yox'}
        5. Açar sözlər: 5-10 açar söz
        ${aiIncludeImages ? '6. Şəkillər: Hər dərsə aid 2-3 şəkil təsviri əlavə edin. Şəkillər üçün [ŞƏKİL: təsvir, URL?] formatında qeyd edin.' : ''}
        
        Hər dərsi aşağıdakı formatda yazın:
        
        DƏRS {1}:
        BAŞLIQ: [dərsin başlığı]
        MƏZMUN: [dərsin məzmunu - sadə dildə, aydın izah]
        ${aiIncludeImages ? 'ŞƏKİLLƏR: [ŞƏKİL 1: təsvir, ŞƏKİL 2: təsvir, ...]' : ''}
        NÜMUNƏLƏR: [nümunələr - hər biri ayrı sətirdə]
        TAPŞIRIQLAR: [tapşırıqlar - hər biri ayrı sətirdə]
        AÇAR SÖZLƏR: [açar söz1, açar söz2, açar söz3, ...]
        
        DƏRS {2}:
        ...
        
        Sadəcə mətni qaytarın, əlavə izahat yazmayın. HTML kodları yazmayın, sadə mətn formatında yazın.
      `;

      const progressInterval = setInterval(() => {
        setAiProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      clearInterval(progressInterval);
      setAiProgress(100);

      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      const lessons = parseGeneratedText(generatedText);
      
      if (lessons.length === 0) {
        throw new Error('Heç bir dərs yaradılmadı');
      }

      setGeneratedLessons(lessons);
      setSelectedLessons(lessons.map((_, index) => index));
      
      message.success(`${lessons.length} dərs uğurla yaradıldı`);
      
    } catch (error) {
      console.error('AI generation error:', error);
      message.error('AI dərsləri yaradılarkən xəta: ' + error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const parseGeneratedText = (text) => {
    const lessons = [];
    const lessonBlocks = text.split(/DƏRS \{\d+\}:/g).filter(block => block.trim().length > 0);
    
    lessonBlocks.forEach((block, index) => {
      const titleMatch = block.match(/BAŞLIQ:\s*(.+?)(?=MƏZMUN:|ŞƏKİLLƏR:|NÜMUNƏLƏR:|TAPŞIRIQLAR:|AÇAR SÖZLƏR:|$)/i);
      const contentMatch = block.match(/MƏZMUN:\s*(.+?)(?=ŞƏKİLLƏR:|NÜMUNƏLƏR:|TAPŞIRIQLAR:|AÇAR SÖZLƏR:|$)/is);
      const imagesMatch = block.match(/ŞƏKİLLƏR:\s*(.+?)(?=NÜMUNƏLƏR:|TAPŞIRIQLAR:|AÇAR SÖZLƏR:|$)/is);
      const examplesMatch = block.match(/NÜMUNƏLƏR:\s*(.+?)(?=TAPŞIRIQLAR:|AÇAR SÖZLƏR:|$)/is);
      const exercisesMatch = block.match(/TAPŞIRIQLAR:\s*(.+?)(?=AÇAR SÖZLƏR:|$)/is);
      const keywordsMatch = block.match(/AÇAR SÖZLƏR:\s*(.+?)(?=$)/i);
      
      const title = titleMatch ? titleMatch[1].trim() : `Dərs ${index + 1}`;
      const content = contentMatch ? contentMatch[1].trim() : 'Məzmun tapılmadı';
      const imagesText = imagesMatch ? imagesMatch[1].trim() : '';
      const examples = examplesMatch ? examplesMatch[1].trim() : '';
      const exercises = exercisesMatch ? exercisesMatch[1].trim() : '';
      const keywords = keywordsMatch 
        ? keywordsMatch[1].split(',').map(k => k.trim()) 
        : [selectedClass?.subject || 'Ümumi'];
      
      const images = [];
      if (imagesText && aiIncludeImages) {
        const imageMatches = imagesText.match(/ŞƏKİL \d+:\s*([^,]+)(?:,\s*(https?:\/\/[^\s]+))?/gi);
        if (imageMatches) {
          imageMatches.forEach((match, idx) => {
            const parts = match.split(/[:\s,]+/);
            const caption = parts.slice(2).join(' ').trim();
            images.push({
              url: getRandomImageUrl(800, 400, index * 10 + idx),
              alt: caption,
              caption: caption
            });
          });
        } else {
          images.push({
            url: getRandomImageUrl(800, 400, index * 10 + 1),
            alt: title,
            caption: `${title} - Şəkilli izah`
          });
        }
      }
      
      const formattedExamples = examples.split('\n').filter(line => line.trim()).map(line => `<li>${line}</li>`).join('');
      const formattedExercises = exercises.split('\n').filter(line => line.trim()).map(line => `<li>${line}</li>`).join('');
      
      const htmlContent = getLessonHTMLTemplate(
        title,
        content.replace(/\n/g, '<br>'),
        formattedExamples ? `<ul>${formattedExamples}</ul>` : '',
        formattedExercises ? `<ol>${formattedExercises}</ol>` : '',
        keywords,
        images
      );
      
      lessons.push({
        title,
        content: htmlContent,
        summary: content.substring(0, 150) + '...',
        duration: 45,
        difficulty: aiDifficulty,
        keywords,
        examples: formattedExamples,
        exercises: formattedExercises,
        images: images,
        rawContent: content
      });
    });
    
    return lessons;
  };

  const saveSelectedLessons = async () => {
    if (selectedLessons.length === 0) {
      message.warning('Heç bir dərs seçilməyib');
      return;
    }

    setLoading(true);

    try {
      const batch = writeBatch(db);
      const lessonsRef = collection(db, COLLECTIONS.LESSONS);
      
      const lessonsToSave = selectedLessons.map(index => generatedLessons[index]);
      
      lessonsToSave.forEach((lesson, index) => {
        const lessonData = {
          title: lesson.title,
          content: lesson.content,
          summary: lesson.summary,
          duration: lesson.duration,
          difficulty: lesson.difficulty,
          keywords: lesson.keywords,
          examples: lesson.examples,
          exercises: lesson.exercises,
          images: lesson.images || [],
          classId: selectedClassId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          status: 'draft',
          order: lessons.length + index,
          isAIGenerated: true,
          aiPrompt: aiPrompt,
          hasImages: (lesson.images && lesson.images.length > 0) || false
        };
        
        const newLessonRef = doc(lessonsRef);
        batch.set(newLessonRef, lessonData);
      });

      const classRef = doc(db, COLLECTIONS.CLASSES, selectedClassId);
      batch.update(classRef, {
        lessonCount: lessons.length + lessonsToSave.length,
        updatedAt: Timestamp.now()
      });

      await batch.commit();
      
      message.success(`${lessonsToSave.length} dərs uğurla əlavə edildi`);
      setIsAIGeneratorVisible(false);
      setAiPrompt('');
      setAiLessonCount(3);
      setCurrentStep(0);
      setGeneratedLessons([]);
      setSelectedLessons([]);
      
    } catch (error) {
      console.error('Error saving lessons:', error);
      message.error('Dərslər yadda saxlanılarkən xəta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (values) => {
    try {
      setLoading(true);
      
      const cleanValues = {
        name: values.name || '',
        description: values.description || '',
        grade: values.grade || '',
        subject: values.subject || '',
        tags: values.tags || []
      };

      const classData = {
        ...cleanValues,
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
      console.error('Error saving class:', error);
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
      if (selectedClassId === classId) {
        setSelectedClassId(null);
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
      
      if (!lessonContent || lessonContent === '<p><br></p>' || lessonContent === '<p></p>') {
        message.error('Please add lesson content');
        setLoading(false);
        return;
      }

      const cleanValues = {
        title: values.title || '',
        status: values.status || 'draft'
      };

      const lessonData = {
        title: cleanValues.title,
        content: lessonContent,
        classId: selectedClassId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: cleanValues.status,
        order: lessons.length,
        summary: values.summary || '',
        duration: values.duration || 45,
        difficulty: values.difficulty || 'medium',
        keywords: values.keywords || []
      };

      if (editingLesson) {
        await updateDoc(doc(db, COLLECTIONS.LESSONS, editingLesson.id), {
          ...lessonData,
          updatedAt: Timestamp.now()
        });
        message.success('Lesson updated successfully');
      } else {
        await addDoc(collection(db, COLLECTIONS.LESSONS), lessonData);
        
        const classRef = doc(db, COLLECTIONS.CLASSES, selectedClassId);
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
      console.error('Error saving lesson:', error);
      message.error('Error saving lesson: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, COLLECTIONS.LESSONS, lessonId));
      
      const classRef = doc(db, COLLECTIONS.CLASSES, selectedClassId);
      await updateDoc(classRef, {
        lessonCount: Math.max(0, lessons.length - 1),
        updatedAt: Timestamp.now()
      });
      
      message.success('Lesson deleted successfully');
    } catch (error) {
      message.error('Error deleting lesson: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(lessons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      sno: index + 1
    }));
    setLessons(updatedItems);

    try {
      const batch = writeBatch(db);
      
      items.forEach((item, index) => {
        const lessonRef = doc(db, COLLECTIONS.LESSONS, item.id);
        batch.update(lessonRef, { 
          order: index,
          updatedAt: Timestamp.now()
        });
      });

      await batch.commit();
      message.success('Lesson order updated successfully');
    } catch (error) {
      console.error('Error updating lesson order:', error);
      message.error('Error updating lesson order: ' + error.message);
      const originalItems = lessons.map((item, index) => ({
        ...item,
        sno: index + 1
      }));
      setLessons(originalItems);
    }
  };

  const openLessonDrawer = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      lessonForm.setFieldsValue({
        title: lesson.title,
        status: lesson.status,
        summary: lesson.summary,
        duration: lesson.duration,
        difficulty: lesson.difficulty,
        keywords: lesson.keywords
      });
      setLessonContent(lesson.content || '');
    } else {
      setEditingLesson(null);
      lessonForm.resetFields();
      setLessonContent('');
    }
    setIsLessonDrawerVisible(true);
  };

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
          <div dangerouslySetInnerHTML={{ __html: record.content }} />
        </div>
      ),
      okText: 'Bağla',
      okButtonProps: {
        style: { background: '#1890ff' }
      }
    });
  };

  const migrateLessons = async () => {
    if (!selectedClassId || lessons.length === 0) return;
    
    const lessonsWithoutOrder = lessons.filter(l => l.order === undefined);
    if (lessonsWithoutOrder.length === 0) return;
    
    Modal.confirm({
      title: 'Köhnə dərsləri yenilə',
      content: `${lessonsWithoutOrder.length} köhnə dərs tapıldı. Onlara sıra nömrəsi əlavə edilsin?`,
      okText: 'Bəli',
      cancelText: 'Xeyr',
      onOk: async () => {
        try {
          setLoading(true);
          const batch = writeBatch(db);
          
          lessons.forEach((lesson, index) => {
            if (lesson.order === undefined) {
              const lessonRef = doc(db, COLLECTIONS.LESSONS, lesson.id);
              batch.update(lessonRef, { 
                order: index,
                updatedAt: Timestamp.now()
              });
            }
          });
          
          await batch.commit();
          message.success('Köhnə dərslər yeniləndi');
        } catch (error) {
          console.error('Error migrating lessons:', error);
          message.error('Xəta baş verdi: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  useEffect(() => {
    if (lessons.length > 0) {
      const lessonsWithoutOrder = lessons.filter(l => l.order === undefined);
      if (lessonsWithoutOrder.length > 0) {
        const timer = setTimeout(() => {
          migrateLessons();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [lessons]);

  // Table columns
  const columns = [
    {
      title: '№',
      dataIndex: 'sno',
      key: 'sno',
      width: 60,
      render: (text, record, index) => (
        <Space>
          <DragOutlined style={{ color: '#999', cursor: 'grab' }} />
          <Tag color="blue">{text}</Tag>
        </Space>
      )
    },
    {
      title: 'Dərsin Başlığı',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          <ReadOutlined style={{ color: '#1890ff' }} />
          <Text strong>{text}</Text>
          {record.isAIGenerated && (
            <Tooltip title="AI tərəfindən yaradılıb">
              <RobotOutlined style={{ color: '#722ed1' }} />
            </Tooltip>
          )}
          {record.hasImages && (
            <Tooltip title="Şəkillər var">
              <PictureOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: 'Çətinlik',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (difficulty) => (
        <Tag color={difficulty === 'easy' ? 'green' : difficulty === 'medium' ? 'orange' : 'red'}>
          {difficulty === 'easy' ? 'Asan' : difficulty === 'medium' ? 'Orta' : 'Çətin'}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge 
          color={status === 'published' ? 'green' : status === 'draft' ? 'orange' : 'default'}
          text={status === 'published' ? 'Dərc' : status === 'draft' ? 'Qaralama' : 'Arxiv'} 
        />
      )
    },
    {
      title: 'Müddət',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration) => `${duration || 45} dəq`
    },
    {
      title: 'Yaradılma Tarixi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt) => createdAt ? new Date(createdAt.toDate()).toLocaleDateString('az-AZ') : '-'
    },
    {
      title: 'Əməliyyatlar',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Məzmunu göstər">
            <Button 
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showContentPreview(record)}
            />
          </Tooltip>
          <Tooltip title="HTML kodu">
            <Button 
              type="text"
              size="small"
              icon={<CodeOutlined />}
              onClick={() => {
                Modal.info({
                  title: `${record.title} - HTML Kodu`,
                  width: 900,
                  content: (
                    <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                      <pre style={{ background: '#f5f5f5', padding: 15, borderRadius: 5 }}>
                        {record.content}
                      </pre>
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
              size="small"
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
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ 
        background: 'white',
        padding: '16px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <Space align="center" size="large">
              <BookOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
              <Title level={3} style={{ margin: 0 }}>Dərslərin İdarə Edilməsi</Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                placeholder="Sinif seçin"
                style={{ width: 300 }}
                value={selectedClassId}
                onChange={handleClassChange}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {classes.map(c => (
                  <Option key={c.id} value={c.id}>
                    <Space>
                      <BookOutlined />
                      {c.name} {c.grade && `- ${c.grade}`}
                      <Tag color="blue">{c.lessonCount || 0} dərs</Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingClass(null);
                  form.resetFields();
                  setIsClassModalVisible(true);
                }}
              >
                Yeni Sinif
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (selectedClassId) {
                    setSelectedClassId(selectedClassId);
                  }
                }}
              >
                Yenilə
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {selectedClassId ? (
          <>
            {/* Class Info Cards */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Cəmi Dərslər"
                    value={lessons.length}
                    prefix={<BookOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="AI Dərsləri"
                    value={lessons.filter(l => l.isAIGenerated).length}
                    prefix={<RobotOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="PDF Sənədlər"
                    value={pdfDocuments.length}
                    prefix={<FilePdfOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Şəkilli Dərslər"
                    value={lessons.filter(l => l.hasImages).length}
                    prefix={<PictureOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Action Buttons */}
            <Card style={{ marginBottom: 16 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space size="middle">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => openLessonDrawer()}
                    >
                      Yeni Dərs
                    </Button>
                    <Button
                      icon={<FilePdfOutlined />}
                      style={{ background: '#ff4d4f', borderColor: '#ff4d4f', color: 'white' }}
                      onClick={() => setIsPDFImportVisible(true)}
                    >
                      Çoxlu PDF Yüklə
                    </Button>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => {
                        console.log('Opening PDF list, documents:', pdfDocuments);
                        setIsPDFListVisible(true);
                      }}
                    >
                      PDF-lərə Bax ({pdfDocuments.length})
                    </Button>
                    <Button
                      icon={<RobotOutlined />}
                      style={{ background: '#722ed1', borderColor: '#722ed1', color: 'white' }}
                      onClick={() => setIsAIGeneratorVisible(true)}
                    >
                      AI ilə Yarat
                    </Button>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    {indexBuilding && (
                      <Tag icon={<WarningOutlined />} color="warning">
                        Index qurulur... Müvəqqəti sıralama
                      </Tag>
                    )}
                    <Tag icon={<DragOutlined />} color="blue">
                      Sürükləyərək sıralayın
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Lessons Table with Drag and Drop */}
            <Card
              title={
                <Space>
                  <ScheduleOutlined />
                  <span>{selectedClass?.name} - Dərslər</span>
                </Space>
              }
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
            >
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="lessons" type="lesson">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      <Table
                        dataSource={lessons}
                        columns={columns}
                        loading={tableLoading}
                        pagination={{ pageSize: 20 }}
                        scroll={{ x: 1200 }}
                        rowKey="id"
                        components={{
                          body: {
                            row: ({ children, ...props }) => {
                              const index = props['data-row-key'];
                              const lesson = lessons.find(l => l.id === index);
                              return (
                                <Draggable
                                  draggableId={index}
                                  index={lessons.findIndex(l => l.id === index)}
                                >
                                  {(provided, snapshot) => (
                                    <tr
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{
                                        ...provided.draggableProps.style,
                                        background: snapshot.isDragging ? '#f9f9f9' : 'white',
                                        border: snapshot.isDragging ? '2px dashed #1890ff' : 'none',
                                        opacity: lesson?.order === undefined ? 0.8 : 1,
                                        cursor: 'grab'
                                      }}
                                    >
                                      {children}
                                    </tr>
                                  )}
                                </Draggable>
                              );
                            }
                          }
                        }}
                      />
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </Card>
          </>
        ) : (
          <Card style={{ textAlign: 'center', padding: '80px 48px' }}>
            <TeamOutlined style={{ fontSize: 64, color: '#ccc' }} />
            <Title level={4} type="secondary" style={{ marginTop: '16px' }}>
              Sinif Seçin
            </Title>
            <Text type="secondary">
              Dərsləri görmək üçün yuxarıdakı seçim qutusundan bir sinif seçin
            </Text>
          </Card>
        )}
      </div>

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
          initialValues={{
            name: '',
            description: '',
            grade: '',
            subject: '',
            tags: []
          }}
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

          <Form.Item
            name="tags"
            label="Teqlər"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Teqlər daxil edin"
              allowClear
            />
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

      {/* Lesson Drawer */}
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
          initialValues={{
            title: '',
            status: 'draft',
            duration: 45,
            difficulty: 'medium',
            keywords: []
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Dərsin Başlığı"
                rules={[{ required: true, message: 'Dərsin başlığını daxil edin' }]}
              >
                <Input placeholder="Dərsin başlığı" size="large" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="duration"
                label="Müddət (dəqiqə)"
              >
                <InputNumber min={5} max={180} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="difficulty"
                label="Çətinlik"
              >
                <Select>
                  <Option value="easy">Asan</Option>
                  <Option value="medium">Orta</Option>
                  <Option value="hard">Çətin</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="summary"
            label="Qısa Xülasə"
          >
            <TextArea rows={2} placeholder="Dərsin qısa xülasəsi" />
          </Form.Item>

          <Form.Item
            name="keywords"
            label="Açar Sözlər"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Açar sözlər daxil edin"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
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
              padding: "20px",
              background: "#fff",
              maxHeight: "400px",
              overflow: "auto"
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: lessonContent }} />
          </Card>
        </Form>
      </Drawer>

      {/* AI Lesson Generator Modal */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#722ed1' }} />
            <span>AI ilə Dərs Yaradılması</span>
          </Space>
        }
        open={isAIGeneratorVisible}
        onCancel={() => {
          setIsAIGeneratorVisible(false);
          setAiPrompt('');
          setAiLessonCount(3);
          setCurrentStep(0);
          setGeneratedLessons([]);
          setSelectedLessons([]);
        }}
        footer={null}
        width={900}
      >
        <Spin spinning={aiGenerating}>
          {!selectedClassId && (
            <Alert
              message="Xəbərdarlıq"
              description="Dərs yaratmaq üçün əvvəlcə bir sinif seçməlisiniz."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Steps current={currentStep} style={{ marginBottom: 24 }}>
            <Step title="Mövzu" icon={<QuestionCircleOutlined />} />
            <Step title="Parametrlər" icon={<SettingOutlined />} />
            <Step title="Yaradılma" icon={<ThunderboltOutlined />} />
            <Step title="Seçim" icon={<CheckCircleOutlined />} />
          </Steps>

          {currentStep === 0 && (
            <Form layout="vertical">
              <Form.Item label="Dərs Mövzusu / Prompt" required>
                <TextArea
                  rows={4}
                  placeholder="Məsələn: Riyaziyyat - Törəmə mövzusunda 3 dərs yarat"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </Form.Item>
              <Alert
                message="İpucu"
                description="Mövzunu dəqiq yazın. Məsələn: 'Fizika - Nyuton qanunları', 'Tarix - Qarabağ xanlığı', 'Ədəbiyyat - Səməd Vurğun'"
                type="info"
                showIcon
              />
            </Form>
          )}

          {currentStep === 1 && (
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Dərs Sayı">
                    <InputNumber
                      min={1}
                      max={20}
                      value={aiLessonCount}
                      onChange={setAiLessonCount}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Çətinlik">
                    <Select value={aiDifficulty} onChange={setAiDifficulty}>
                      <Option value="easy">Asan</Option>
                      <Option value="medium">Orta</Option>
                      <Option value="hard">Çətin</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Dərs Tipi">
                    <Select value={aiLessonType} onChange={setAiLessonType}>
                      <Option value="theory">Nəzəri</Option>
                      <Option value="practice">Praktik</Option>
                      <Option value="mixed">Qarışıq</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Dil">
                    <Select value={aiLanguage} onChange={setAiLanguage}>
                      <Option value="az">Azərbaycan</Option>
                      <Option value="en">İngilis</Option>
                      <Option value="ru">Rus</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Əlavə Seçimlər">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Checkbox 
                    checked={aiIncludeExamples} 
                    onChange={(e) => setAiIncludeExamples(e.target.checked)}
                  >
                    Nümunələr əlavə et
                  </Checkbox>
                  <Checkbox 
                    checked={aiIncludeExercises} 
                    onChange={(e) => setAiIncludeExercises(e.target.checked)}
                  >
                    Tapşırıqlar əlavə et
                  </Checkbox>
                  <Checkbox 
                    checked={aiIncludeImages} 
                    onChange={(e) => setAiIncludeImages(e.target.checked)}
                  >
                    Şəkillər əlavə et (pulsuz şəkillər)
                  </Checkbox>
                </Space>
              </Form.Item>
            </Form>
          )}

          {currentStep === 2 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              {aiGenerating ? (
                <>
                  <Progress type="circle" percent={aiProgress} status="active" />
                  <Title level={4} style={{ marginTop: 20 }}>Dərslər yaradılır...</Title>
                  <Paragraph>
                    <Text type="secondary">Zəhmət olmasa gözləyin. Bu bir neçə saniyə çəkə bilər.</Text>
                  </Paragraph>
                </>
              ) : (
                <>
                  <ThunderboltOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }} />
                  <Title level={4}>Dərslər yaradılmağa hazırdır!</Title>
                  <Paragraph>
                    <Text strong>Mövzu:</Text> {aiPrompt}<br />
                    <Text strong>Dərs sayı:</Text> {aiLessonCount}<br />
                    <Text strong>Çətinlik:</Text> {aiDifficulty === 'easy' ? 'Asan' : aiDifficulty === 'medium' ? 'Orta' : 'Çətin'}<br />
                    <Text strong>Sinif:</Text> {selectedClass?.name}
                  </Paragraph>
                  <Alert
                    message="Qeyd"
                    description="AI tərəfindən yaradılan dərsləri yoxlamaq və redaktə etmək tövsiyə olunur."
                    type="info"
                    showIcon
                  />
                </>
              )}
            </div>
          )}

          {currentStep === 3 && generatedLessons.length > 0 && (
            <div>
              <Alert
                message={`${generatedLessons.length} dərs yaradıldı`}
                description="İstədiyiniz dərsləri seçin və 'Seçilmişləri Yadda Saxla' düyməsini klikləyin."
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <List
                itemLayout="horizontal"
                dataSource={generatedLessons}
                style={{ maxHeight: 400, overflow: 'auto' }}
                renderItem={(lesson, index) => (
                  <List.Item
                    actions={[
                      <Checkbox 
                        checked={selectedLessons.includes(index)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLessons([...selectedLessons, index]);
                          } else {
                            setSelectedLessons(selectedLessons.filter(i => i !== index));
                          }
                        }}
                      >
                        Seç
                      </Checkbox>,
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => {
                          Modal.info({
                            title: lesson.title,
                            width: 900,
                            content: (
                              <div style={{ maxHeight: 500, overflow: 'auto', padding: 20 }}>
                                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                              </div>
                            ),
                            okText: 'Bağla'
                          });
                        }}
                      >
                        Önizlə
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ background: '#722ed1' }}>{index + 1}</Avatar>}
                      title={
                        <Space>
                          {lesson.title}
                          {lesson.images && lesson.images.length > 0 && (
                            <PictureOutlined style={{ color: '#52c41a' }} />
                          )}
                        </Space>
                      }
                      description={
                        <Space>
                          <Tag color="blue">{lesson.duration} dəq</Tag>
                          <Tag color={lesson.difficulty === 'easy' ? 'green' : lesson.difficulty === 'medium' ? 'orange' : 'red'}>
                            {lesson.difficulty === 'easy' ? 'Asan' : lesson.difficulty === 'medium' ? 'Orta' : 'Çətin'}
                          </Tag>
                          <Tag color="purple">{lesson.keywords.slice(0, 3).join(', ')}</Tag>
                          {lesson.images && lesson.images.length > 0 && (
                            <Tag color="green">{lesson.images.length} şəkil</Tag>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
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
            <Space>
              {currentStep === 3 ? (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={saveSelectedLessons}
                  loading={loading}
                  disabled={selectedLessons.length === 0}
                >
                  Seçilmişləri Yadda Saxla ({selectedLessons.length})
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => {
                    if (currentStep === 0 && !aiPrompt) {
                      message.warning('Zəhmət olmasa mövzu daxil edin');
                      return;
                    }
                    if (currentStep === 2) {
                      generateLessonsWithAI();
                      setCurrentStep(3);
                    } else {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={currentStep === 2 && aiGenerating}
                >
                  {currentStep === 2 ? 'Yarat' : 'İrəli'}
                </Button>
              )}
            </Space>
          </div>
        </Spin>
      </Modal>

      {/* Multi PDF Import Modal */}
      <MultiPDFImportModal
        visible={isPDFImportVisible}
        onCancel={() => setIsPDFImportVisible(false)}
        onSuccess={handlePDFSuccess}
        classId={selectedClassId}
      />

      {/* PDF List Drawer */}
      <PDFListDrawer
        visible={isPDFListVisible}
        onClose={() => setIsPDFListVisible(false)}
        pdfs={pdfDocuments}
        onViewPDF={showPDFPreview}
        onDeletePDF={handleDeletePDF}
        onRefresh={() => {
          if (selectedClassId) {
            fetchPDFs();
          }
        }}
      />
    </Layout>
  );
};

export default CreateClass;