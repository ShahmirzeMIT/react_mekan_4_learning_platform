import {Col, Form, Input, Radio, Row, Select} from "antd";
import React, {useCallback, useEffect, useState} from "react";
import {debounce} from "@/utils/ui-canvas/debounce.ts";

const {TextArea} = Input;

export default function UIEditorUpdateStyle({selectedComponent, updateComponent}) {
    const [componentInfo, setComponentInfo] = useState<any>(selectedComponent);
    const [cssTarget, setCssTarget] = useState<"container" | "component">("container");
    const [cssValues, setCssValues] = useState<Record<string, string>>({});

    // Debounce ilə input change
    const handleChange = useCallback(
        debounce((key: string, val: string) => {
            setCssValues(prev => ({...prev, [key]: val}));
        }, 150),
        []
    );

    // SelectedComponent dəyişdikdə state-i yenilə
    useEffect(() => {
        setComponentInfo(selectedComponent);
        if (!selectedComponent) return;

        const targetKey = cssTarget === "container" ? "containerCss" : "componentCss";
        const cssString = selectedComponent?.css?.[targetKey] || "";

        const entries: Record<string, string> = {};
        cssString.split(";").forEach(entry => {
            const [key, value] = entry.split(":").map(s => s?.trim());
            if (key && value) {
                const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
                entries[camelKey] = value.replace("px", "");
            }
        });

        setCssValues({
            ...entries,
            allCss: cssString,
            width: entries.width || "",
            height: entries.height || "",
            fontSize: entries.fontSize || "",
            borderWidth: entries.borderWidth || "",
            borderStyle: entries.borderStyle || "",
            background: entries.background || "#ffffff",
            color: entries.color || "#000000",
        });
    }, [selectedComponent, cssTarget]);

    const updateCss = (property: string, value: string) => {
        if (!componentInfo) return;

        const targetKey = cssTarget === "container" ? "containerCss" : "componentCss";
        const oldCss = componentInfo?.css?.[targetKey] || "";
        const regex = new RegExp(`${property}:\\s*[^;]+;?`, "i");

        let newCss = "";
        if (regex.test(oldCss)) {
            newCss = oldCss.replace(regex, `${property}: ${value};`);
        } else {
            newCss = `${oldCss.trim()} ${property}: ${value};`.trim();
        }

        updateComponent({
            ...componentInfo,
            css: {
                ...componentInfo.css,
                [targetKey]: newCss,
            },
        });

        setCssValues(prev => ({...prev, [property]: value, allCss: newCss}));
    };

    const updateAllCss = (newCss: string) => {
        if (!componentInfo) return;
        const targetKey = cssTarget === "container" ? "containerCss" : "componentCss";

        updateComponent({
            ...componentInfo,
            css: {
                ...componentInfo.css,
                [targetKey]: newCss,
            },
        });

        setCssValues(prev => ({...prev, allCss: newCss}));
    };

    if (!componentInfo) return null;

    return (
        <Form layout="vertical">
            <Form.Item label="CSS Target">
                <Radio.Group
                    value={cssTarget}
                    onChange={(e) => setCssTarget(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                >
                    <Radio.Button value="container">Container</Radio.Button>
                    <Radio.Button value="component">Component</Radio.Button>
                </Radio.Group>
            </Form.Item>

            <Form.Item label="Custom CSS">
                <TextArea
                    rows={8}
                    disabled={!componentInfo}
                    value={cssValues.allCss || ""}
                    onChange={(e) => handleChange("allCss", e.target.value)}
                    onBlur={(e) => updateAllCss(e.target.value)}
                />
            </Form.Item>

            <Row gutter={8}>
                <Col span={12}>
                    <Form.Item label="Width (px)">
                        <Input
                            type="number"
                            disabled={!componentInfo}
                            value={cssValues.width || ""}
                            onChange={(e) => handleChange("width", e.target.value)}
                            onBlur={(e) => updateCss("width", e.target.value ? `${e.target.value}px` : "")}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Height (px)">
                        <Input
                            type="number"
                            disabled={!componentInfo}
                            value={cssValues.height || ""}
                            onChange={(e) => handleChange("height", e.target.value)}
                            onBlur={(e) => updateCss("height", e.target.value ? `${e.target.value}px` : "")}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item label="Background Color">
                <Input
                    type="color"
                    disabled={!componentInfo}
                    value={cssValues.background || "#ffffff"}
                    onChange={(e) => handleChange("background", e.target.value)}
                    onBlur={(e) => updateCss("background", e.target.value)}
                />
            </Form.Item>

            <Form.Item label="Font Color">
                <Input
                    type="color"
                    disabled={!componentInfo}
                    value={cssValues.color || "#000000"}
                    onChange={(e) => handleChange("color", e.target.value)}
                    onBlur={(e) => updateCss("color", e.target.value)}
                />
            </Form.Item>

            <Form.Item label="Font Size (px)">
                <Input
                    type="number"
                    disabled={!componentInfo}
                    value={cssValues.fontSize || ""}
                    onChange={(e) => handleChange("fontSize", e.target.value)}
                    onBlur={(e) => updateCss("font-size", e.target.value ? `${e.target.value}px` : "")}
                />
            </Form.Item>

            <Form.Item label="Border Width (px)">
                <Input
                    type="number"
                    disabled={!componentInfo}
                    value={cssValues.borderWidth || ""}
                    onChange={(e) => handleChange("borderWidth", e.target.value)}
                    onBlur={(e) => updateCss("border-width", e.target.value ? `${e.target.value}px` : "")}
                />
            </Form.Item>

            <Form.Item label="Border Style">
                <Select
                    disabled={!componentInfo}
                    value={cssValues.borderStyle || ""}
                    onChange={(val) => updateCss("border-style", val)}
                >
                    <Select.Option value="">Select Border Style</Select.Option>
                    <Select.Option value="solid">Solid</Select.Option>
                    <Select.Option value="dashed">Dashed</Select.Option>
                    <Select.Option value="dotted">Dotted</Select.Option>
                </Select>
            </Form.Item>
        </Form>
    );
}
