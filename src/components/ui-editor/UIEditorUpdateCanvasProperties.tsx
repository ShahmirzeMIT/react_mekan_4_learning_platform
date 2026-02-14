import {Col, Form, Input, message, Row, Select} from "antd";
import React, {useEffect, useState} from "react";
import {deviceOptions} from "@/components/ui-editor/types.ts";
import {doc, getDoc, updateDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";

async function updatePrototypes(css, selectedUICanvasId) {

    const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);
    const docSnap = await getDoc(uiCanvasDocRef);
    const docData = docSnap.data();
    const canvasInputs = docData?.input?.[selectedUICanvasId] || {};

    const updatedAllInput = {
        ...docData.input,
        [selectedUICanvasId]: {...canvasInputs, css}
    };
    try {
        await updateDoc(uiCanvasDocRef, {input: updatedAllInput});
        // message.success("Components updated successfully!");

    } catch (e) {
        console.error(e);
        message.error("Error updating");
    }

}

export default function UIEditorUpdateCanvasProperties({inputs, selectedUICanvasId}) {
    const [containerCss, setContainerCss] = useState<string>("width: 900px; height: auto;");

    useEffect(() => {
        if (Object.keys(inputs).length === 0) {
            setContainerCss("width: 900px; height: auto")
            return
        }
        const newCss =
            inputs?.css && inputs.css.trim() !== ""
                ? inputs.css
                : "width: 900px; height: auto;";
        setContainerCss(newCss);
    }, [inputs]);
    return (
        <Form>

            <Form.Item label="Canvas">
                <Select
                    defaultValue="Responsible"
                    onChange={(value) => {
                        const device = deviceOptions.find(d => d.value === value);
                        if (!device) return;

                        const {width, height} = device;

                        // Responsible üçün reset
                        if (value === "Responsible") {
                            setContainerCss("");

                            return;
                        }

                        let newCss = containerCss;

                        if (width) {
                            if (newCss.includes("width:"))
                                newCss = newCss.replace(/width:\s*[^;]+;/, `width: ${width}px;`);
                            else newCss += `width: ${width}px;`;
                        }

                        if (height) {
                            if (newCss.includes("height:"))
                                newCss = newCss.replace(/height:\s*[^;]+;/, `height: ${height}px;`);
                            else newCss += `height: ${height}px;`;
                        }

                        setContainerCss(newCss);
                        updatePrototypes(newCss, selectedUICanvasId)
                    }}
                    value={
                        deviceOptions.find(
                            (item) =>
                                String(item.width) ===
                                containerCss.match(/width:\s*([^;]+)/)?.[1]?.replace("px", "") &&
                                String(item.height) ===
                                containerCss.match(/height:\s*([^;]+)/)?.[1]?.replace("px", "")
                        )?.value || "Responsible"
                    }
                >
                    {deviceOptions.map((d) => (
                        <Select.Option key={d.value} value={d.value} width={d.width} height={d.height}>
                            {d.label}
                        </Select.Option>
                    ))}

                </Select>
            </Form.Item>

            <Row gutter={8}>
                <Col span={12}>
                    <Form.Item label="Width (px)">
                        <Input
                            type="number"
                            value={
                                (() => {
                                    const widthMatch = containerCss.match(/width:\s*([^;]+)/)?.[1];
                                    if (!widthMatch) return "900"; // hiç width yoksa → 900
                                    if (widthMatch.includes("%")) return ""; // 100% ise input boş
                                    return widthMatch.replace("px", "");
                                })()
                            }
                            onChange={(e) => {
                                const val = e.target.value;

                                // boşsa width property’sini sil
                                let newCss = containerCss;
                                if (val === "") {
                                    newCss = newCss.replace(/width:\s*[^;]+;?/, "").trim();
                                } else {
                                    newCss = newCss.includes("width:")
                                        ? newCss.replace(/width:\s*[^;]+;/, `width: ${val}px;`)
                                        : newCss + `width: ${val}px;`;
                                }

                                setContainerCss(newCss);
                            }}
                            onBlur={() => {
                                updatePrototypes(containerCss, selectedUICanvasId)
                            }}
                        />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item label="Height (px)">
                        <Input
                            type="number"
                            value={containerCss.match(/height:\s*([^;]+)/)?.[1]?.replace("px", "") || ""}
                            onChange={(e) => {
                                const val = e.target.value;

                                let newCss = containerCss;
                                if (val === "") {
                                    newCss = newCss.replace(/height:\s*[^;]+;?/, "").trim();
                                } else {
                                    newCss = newCss.includes("height:")
                                        ? newCss.replace(/height:\s*[^;]+;/, `height: ${val}px;`)
                                        : newCss + `height: ${val}px;`;
                                }

                                setContainerCss(newCss);
                            }}
                            onBlur={() => {
                                updatePrototypes(containerCss, selectedUICanvasId)
                            }}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </Form>)
}