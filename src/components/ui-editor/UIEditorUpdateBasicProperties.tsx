import {Checkbox, Input, Select, Space} from "antd";
import {ComponentType, componentTypesObj} from "@/components/ui-canvas/common/types.ts";
import {componentIcons} from "@/ui-canvas/ui-editor/UIEditorCanvas.tsx";
import {useEffect, useState} from "react";

const {Option} = Select;
const {TextArea} = Input;
export default function UIEditorUpdateBasicProperties({selectedComponent, updateComponent}) {
    const [componentInfo, setComponentInfo] = useState<any>(selectedComponent);

    useEffect(() => {
        setComponentInfo(selectedComponent);
    }, [selectedComponent]);


    return (<>
            <Space direction="vertical" style={{width: "100%"}}>
                {/*<div>*/}
                {/*    <label>Component ID:</label>*/}
                {/*    <Input value={selectedComponent.id} disabled/>*/}
                {/*</div>*/}
                <div>
                    <label>Input Name:</label>
                    <Input value={componentInfo.inputName}
                           onChange={(e) =>
                               setComponentInfo((prev) => ({
                                   ...prev,
                                   inputName: e.target.value,
                               }))
                           }
                           onBlur={() => {
                               updateComponent({...componentInfo})
                           }}/>
                </div>

                <div>
                    <label>Component Type:</label>
                    <Select
                        value={componentInfo.componentType}
                        style={{width: "100%"}}
                        onChange={(value) => {
                            updateComponent({...componentInfo, componentType: value})
                        }}
                    >
                        {Object.keys(componentTypesObj).map((key) => {
                            const type = key as ComponentType;
                            const {label} = componentTypesObj[type];
                            const icon = componentIcons[type];
                            return (
                                <Option value={key}>
                                    {icon} {label}
                                </Option>
                            )
                        })}
                    </Select>
                </div>
                <div>
                    <label>Content:</label>
                    <TextArea
                        value={componentInfo.content}
                        onChange={(e) =>
                            setComponentInfo((prev) => ({
                                ...prev,
                                content: e.target.value,
                            }))
                        }
                        onBlur={() => {
                            updateComponent({...componentInfo})
                        }}
                    />
                </div>
                {selectedComponent.type === "button" && (
                    <>
                        <div>
                            <label>Variant:</label>
                            <Select
                                value={selectedComponent.variant}
                                style={{width: "100%"}}
                                onChange={(value) =>
                                    updateComponent(selectedComponent.id, {
                                        variant: value,
                                    })
                                }
                            >
                                <Option value="primary">Primary</Option>
                                <Option value="dashed">Dashed</Option>
                                <Option value="text">Text</Option>
                                <Option value="link">Link</Option>
                            </Select>
                        </div>
                        <div>
                            <label>Size:</label>
                            <Select
                                value={selectedComponent.size}
                                style={{width: "100%"}}
                                onChange={(value) =>
                                    updateComponent(selectedComponent.id, {
                                        size: value,
                                    })
                                }
                            >
                                <Option value="small">Small</Option>
                                <Option value="middle">Middle</Option>
                                <Option value="large">Large</Option>
                            </Select>
                        </div>
                    </>
                )}
                {selectedComponent.type === "img" && (
                    <div>
                        <label>Image URL:</label>
                        <Input
                            value={selectedComponent.src}
                            onChange={(e) =>
                                updateComponent(selectedComponent.id, {
                                    src: e.target.value,
                                })
                            }
                        />
                    </div>
                )}
                {selectedComponent.type === "cmb" && (
                    <div>
                        <label>Options (comma separated):</label>
                        <Input
                            value={selectedComponent.options?.join(",")}
                            onChange={(e) =>
                                updateComponent(selectedComponent.id, {
                                    options: e.target.value.split(","),
                                })
                            }
                        />
                    </div>
                )}
                {(selectedComponent.type === "cbox" ||
                    selectedComponent.type === "rbtn") && (
                    <div>
                        <label>Checked:</label>
                        <Checkbox
                            checked={selectedComponent.checked}
                            onChange={(e) =>
                                updateComponent(selectedComponent.id, {
                                    checked: e.target.checked,
                                })
                            }
                        />
                    </div>
                )}
                {selectedComponent.type === "hlink" && (
                    <div>
                        <label>URL:</label>
                        <Input
                            value={selectedComponent.url}
                            onChange={(e) =>
                                updateComponent(selectedComponent.id, {
                                    url: e.target.value,
                                })
                            }
                        />
                    </div>
                )}
                {selectedComponent.type === "ytube" && (
                    <div>
                        <label>YouTube URL:</label>
                        <Input
                            value={selectedComponent.url}
                            onChange={(e) =>
                                updateComponent(selectedComponent.id, {
                                    url: e.target.value,
                                })
                            }
                        />
                    </div>
                )}
                {selectedComponent.type === "tbl" && (
                    <div>
                        <label>Columns (JSON):</label>
                        <TextArea
                            rows={3}
                            value={JSON.stringify(
                                selectedComponent.columns,
                                null,
                                2
                            )}
                            onChange={(e) => {
                                try {
                                    updateComponent(selectedComponent.id, {
                                        columns: JSON.parse(e.target.value),
                                    });
                                } catch (e) {
                                    console.log(e)
                                }
                            }}
                        />
                        <label style={{marginTop: "8px"}}>
                            Data (JSON):
                        </label>
                        <TextArea
                            rows={4}
                            value={JSON.stringify(
                                selectedComponent.data,
                                null,
                                2
                            )}
                            onChange={(e) => {
                                try {
                                    updateComponent(selectedComponent.id, {
                                        data: JSON.parse(e.target.value),
                                    });
                                } catch (e) {
                                    console.log(e)
                                }
                            }}
                        />
                    </div>
                )}
            </Space>
        </>
    )
}