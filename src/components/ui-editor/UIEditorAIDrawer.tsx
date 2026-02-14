import {Button, Drawer, Input, Space, Spin} from "antd";
import {useState} from "react";
import {callApi} from "@/utils/callApi.ts";
import UIPrototype from "@/hooks/ui-canvas/ui-prototype/UIPrototype.tsx";
import {SaveOutlined} from "@ant-design/icons";
import useUICanvasUpdate from "@/hooks/ui-canvas/useUICanvasUpdate.tsx";

const {TextArea} = Input;
export default function UIEditorAIDrawer({open, onClose, canvasId}) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [inputs, setInputs] = useState({});
    const {updateUICanvas} = useUICanvasUpdate({selectedUICanvasId: canvasId})
    const handleGenerate = async () => {
        try {
            setLoading(true);
            const response = await callApi("/ui-editor/generate-ui", {prompt, canvasId});
            setInputs(response.inputs[canvasId]);
            setLoading(false);
        } catch (e) {
            console.log(e)
            setLoading(false);
        }
    };

    const handleSave = () => {
        try {
            updateUICanvas(inputs);
            onClose();
            setPrompt("")
            setInputs({})
        } catch (e) {
            console.log(e)
        }
    }

    function submitWithKeyPress(e) {
        if (e.code === "Enter" && e.ctrlKey) {
            handleGenerate()
        }
    }

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="AI Assistant"
            width={1000}
            footer={
                <div style={{display: "flex", gap: 8}}>
                    <Button type="primary" icon={<SaveOutlined/>} disabled={!Object.keys(inputs).length}
                            onClick={handleSave}>
                        Save UI
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </div>
            }
        >
            <Space direction="vertical" style={{width: "100%"}}>
                <TextArea
                    rows={4}
                    placeholder="Write your prompt here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={submitWithKeyPress}
                />

                <Button
                    type="primary"
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? <Spin size="small"/> : "Generate UI"}
                </Button>
            </Space>
            <UIPrototype preview={true} componentsJson={inputs ?? {}} selectedUICanvasId={canvasId} />
        </Drawer>
    )
}