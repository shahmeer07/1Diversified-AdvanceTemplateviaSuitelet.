/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @description This file contains all the constants for the project.
 */

define([], function () {
    return {
        ESTIMATOR: {
            TITLE: 'Estimator',
            FIELDS: {
                CUSTOMER: 'custpage_customer',
                PROJECT: 'custpage_project',
                OPPORTUNITY: 'custpage_opportunity',
                ID: 'custpage_system_id',
                ID_SELECT: 'custpage_system_id_select',
                NAME: 'custpage_system_name',
                EXISTING_ID_CB: 'custpage_existing_system_id',
                ROLL_CB: 'custpage_roll_out_project',
                SELECT_TAB: 'custpage_select_tab'
            },
            LABOUR_PLAN: {
                TAB_ID: 'custpage_tab_lp',
                SUBLIST_ID: 'custpage_sublist_lp',
                ITEM: 'custpage_item_lp',
                QTY: 'custpage_quantity_lp',
                PRICE: 'custpage_base_price_lp',
                DISCOUNT: 'custpage_discount_lp',
                TOTAL_PRICE: 'custpage_total_price_lp',
                COST: 'custpage_cost_lp',
                EXT_COST: 'custpage_ext_cost_lp',
                MARGIN_PERCENT: 'custpage_margin_percent_lp',
                LOGS: 'custpage_logs_lp'
            },
            MISC_COST: {
                TAB_ID: 'custpage_tab_mc',
                SUBLIST_ID: 'custpage_sublist_mc',
                ITEM: 'custpage_item_mc',
                QTY: 'custpage_quantity_mc',
                PRICE: 'custpage_base_price_mc',
                DISCOUNT: 'custpage_discount_mc',
                TOTAL_PRICE: 'custpage_total_price_mc',
                COST: 'custpage_cost_mc',
                EXT_COST: 'custpage_ext_cost_mc',
                MARGIN_PERCENT: 'custpage_margin_percent_mc',
                LOGS: 'custpage_logs_mc'
            },
            ROOMS: {
                TAB_ID: 'custpage_tab_',
                QUANTITY: 'custpage_tab_quantity_',
                ROOM_ID: 'custpage_tab_system_room_id_',
                ROOM_NAME: 'custpage_tab_room_name_',
                ORDER_TYPE: 'custpage_tab_order_type_',
                SHIP_TO: 'custpage_tab_ship_address_',
                COLUMNS: 'custpage_tab_cols_',
                FILTERS: 'custpage_tab_col_filters_',
                SORT: 'custpage_sort_',
                SUBLIST: {
                    ID: 'custpage_sublist_',
                    INDEX: 'custpage_serial_no_',
                    FLAG: 'custpage_flag_',
                    DESIGN_NOTES: 'custpage_design_notes_',
                    QTY: 'custpage_quantity_',
                    MANUF: 'custpage_manufacturer_',
                    MPN: 'custpage_mpn_',
                    ITEM_DESC: 'custpage_unit_desc_',
                    COST: 'custpage_cost_',
                    EXT_COST: 'custpage_ext_cost_',
                    PRICE: 'custpage_base_price_',
                    DISCOUNT: 'custpage_discount_',
                    TOTAL_PRICE: 'custpage_total_price_',
                    MARGIN_PERCENT: 'custpage_margin_percent_',
                    PRICE_LEVEL: 'custpage_price_level_',
                    ITEM: 'custpage_item_',
                    UNIT_MEASURE: 'custpage_unit_measure_',
                    COST_CAT: 'custpage_cost_category_',
                    ITEM_TYPE: 'custpage_item_type_',
                    CUSTOM: 'custpage_custom_',
                    OFE: 'custpage_ofe_',
                    GSA: 'custpage_gsa_',
                    TAA: 'custpage_taa_',
                    COUNTRY_OF_MANUF: 'custpage_manufacturer_country_',
                    PROD_MAIN_CAT: 'custpage_item_category_',
                    PROD_SUB_CAT: 'custpage_item_subcategory_',
                    PROD_LINE: 'custpage_product_line_',
                    LEAD_TIME: 'custpage_lead_time_',
                    PREF: 'custpage_pref_',
                    PREF_VENDOR: 'custpage_pref_vendor_',
                    RACK: 'custpage_rack_assembly_',
                    REQD_COMM: 'custpage_comm_req_',
                    EXE_NOTES: 'custpage_execution_notes_',
                    RU: 'custpage_ru_',
                    EXT_RU: 'custpage_ext_ru_',
                    POW: 'custpage_power_consumption_',
                    EXT_POW: 'custpage_ext_power_consumption_',
                    HEAT: 'custpage_heat_ouput_',
                    EXT_HEAT: 'custpage_ext_heat_output_',
                    WEIGHT: 'custpage_weight_',
                    EXT_WEIGHT: 'custpage_ext_weight_',
                    SPECIAL_PRICING: 'custpage_special_pricing_',
                    EOL: 'custpage_eol_',
                    C1: 'custpage_custom1_',
                    C2: 'custpage_custom2_',
                    C3: 'custpage_custom3_',
                    C4: 'custpage_custom4_',
                    C5: 'custpage_custom5_',
                    LOGS: 'custpage_logs_'
                }
            },
            BUTTONS: {
                SUBMIT: {
                    LABEL: 'Create Estimates'
                },
                INSERT: {
                    ID: 'custpage_insert_button',
                    LABEL: '+New Tab',
                    FUNCTION: 'onInsertButtonClick'
                },
                COPY: {
                    ID: 'custpage_copy_button',
                    LABEL: 'Copy',
                    FUNCTION: 'onCopyButtonClick'
                },
                RENAME: {
                    ID: 'custpage_rename_button',
                    LABEL: 'Rename',
                    FUNCTION: 'onRenameButtonClick'
                },
                SAVE: {
                    ID: 'custpage_save_button',
                    LABEL: 'Save',
                    FUNCTION: 'onSaveButtonClick'
                },
                DELETE: {
                    ID: 'custpage_delete_button',
                    LABEL: 'Delete',
                    FUNCTION: 'onDeleteButtonClick'
                },
                HIDE: {
                    ID: 'custpage_hide_groups',
                    LABEL: 'Hide Columns',
                    FUNCTION: 'onHideClick'
                },
                SORT: {
                    ID: 'custpage_sort_button',
                    LABEL: 'Re Index',
                    FUNCTION: 'onSortButtonClick'
                },
                PRINT: {
                    ID: 'custpage_print_button',
                    LABEL: 'Print PDF',
                    FUNCTION: 'onPrintButtonClick'
                },
                IMPORT: {
                    ID: 'custpage_import_button',
                    LABEL: 'Import/Export CSV',
                    FUNCTION: 'onImportButtonClick'
                },
                SUMMARY: {
                    ID: 'custpage_summary_button',
                    LABEL: 'Summary',
                    FUNCTION: 'onSummaryButtonClick'
                },
                COPY_NSID: {
                    ID: 'custpage_copy_netsuite_id',
                    LABEL: 'Copy Estimator ID',
                    FUNCTION: 'onCopyNetsuiteIdButtonClick'
                },
                PRINT_CSV: {
                    ID: 'custpage_print_csv_button',
                    LABEL: 'Print CSV',
                    FUNCTION: 'onPrintCSVButtonClick'
                }
            },
            PARAM:{
                ID: 'id',
                EXISTING_ID: 'eid',
                EXISTING_ID_CB: 'e',
                NAME: 'name',
                CUSTOMER: 'cus',
                TEMPLATE: 'temp',
                ROOMS: 'rooms',
                COPY_ROOMS: 'copy',
                PROJECT: 'job',
                OPPORTUNITY: 'opp',
                INCREMENT: 'add',
                GROUP: 'grp',
                OLD_NAME: 'old',
                NEW_NAME: 'new',
                ROLL_CB: 'rol',
                GET: 'get',
            },
            CLIENT_SCRIPT_PATH: '/SuiteScripts/TPC/ClientScript/div_tpc_est_cs.js',
            URL: '/app/site/hosting/scriptlet.nl?script=5828&deploy=1',
            ESTIMATOR_SL_OPPORTUNITY: 'customsublist357'
        },
        TEMPLATE: {
            RECORD_TYPE: 'customrecord_div_tpc_sub_head_temp',
            FIELDS: {
                NAME: 'name'
            },
            SUBLIST: {
                ID: 'recmachcustrecord_sub_head_list_parent',
                INDEX: 'custrecord_sh_list_index',
                FLAG: 'custrecord_sub_head_flag',
                DESIGN_NOTES: 'custrecord_sh_list_design_notes',
                QTY: 'custrecord_sub_head_list_qty',
                MANUF: 'custrecord_sub_head_list_manufacturer',
                MPN: 'custrecord_sub_head_list_mpn',
                ITEM_DESC: 'custrecord_sh_list_item_desc',
                COST: 'custrecord_sub_head_list_std_cost',
                EXT_COST: 'custrecord_sh_list_ext_cost',
                PRICE: 'custrecord_sh_list_base_price',
                DISCOUNT: 'custrecord_sh_list_discount',
                TOTAL_PRICE: 'custrecord_sh_list_ext_total_price',
                ITEM: 'custrecord_sub_head_list_items',
                UNIT_MEASURE: 'custrecord_sh_list_unit_measure',
                COST_CAT: 'custrecord_sh_list_cost_category',
                ITEM_TYPE: 'custrecord_sh_list_item_type',
                CUSTOM: 'custrecord_sh_list_custom',
                OFE: 'custrecord_sh_list_ofe',
                GSA: 'custrecord_sh_list_gsa',
                TAA: 'custrecord_sh_list_taa',
                COUNTRY_OF_MANUF: 'custrecord_sh_list_country_manuf',
                PROD_MAIN_CAT: 'custrecord_sh_list_item_cat',
                PROD_SUB_CAT: 'custrecord_sh_list_item_sub_cat',
                PROD_LINE: 'custrecord_sh_list_prod_line',
                LEAD_TIME: 'custrecord_sh_list_lead_time',
                PREF: 'custrecord_sh_list_pref',
                PREF_VENDOR: 'custrecord_sh_list_pref_vendor',
                RACK: 'custrecord_sh_list_rack_assembly',
                REQD_COMM: 'custrecord_sh_list_commissioning_req',
                EXE_NOTES: 'custrecord_sub_head_list_notes',
                RU: 'custrecord_sh_list_ru',
                EXT_RU: 'custrecord_sh_list_ext_ru',
                POW: 'custrecord_sh_list_power_consumption',
                EXT_POW: 'custrecord_sh_list_ext_power_comsumption',
                HEAT: 'custrecord_sh_list_heat_output',
                EXT_HEAT: 'custrecord_sh_list_ext_heat_output',
                WEIGHT: 'custrecord_sh_list_item_weight',
                EXT_WEIGHT: 'custrecord_sh_list_ext_weight',
                SPECIAL_PRICING: 'custrecord_sh_list_special_pricing',
                C1: 'custrecord_sh_list_custom1',
                C2: 'custrecord_sh_list_custom2',
                C3: 'custrecord_sh_list_custom3',
                C4: 'custrecord_sh_list_custom4',
                C5: 'custrecord_sh_list_custom5',
                KEY: 'custrecord_sub_head_list_parent'
            }
        },
        ESTIMATOR_SAVED: {
            RECORD_TYPE: 'customrecord_div_tpc_est_sub_headers',
            FIELDS: {
                ID: 'name',
                NAME: 'custrecord_est_sys_name',
                CUSTOMER: 'custrecord_est_customer',
                PROJECT: 'custrecord_est_project',
                OPPORTUNITY: 'custrecord_est_opport',
                LABOUR_PLAN: 'custrecord_est_labour_plan_saved_data',
                MISC_COST: 'custrecord_est_misc_saved_data',
                SUBHEADERS: 'custrecord_est_saved_data',
                MEMO: 'custrecord_est_memo',
                URL: 'custrecord_est_url',
                FILE: 'custrecord_est_file',
                FOLDER_ID: '14784',
                FILE_PATH: '/SuiteScripts/TPC/SAVED JSON Files/'
            }
        },
        ESTIMATOR_RAW: {
            RECORD_TYPE: 'customrecord_div_tpc_est_raw_data',
            FIELDS: {
                ID: 'name',
                NAME: 'custrecord_raw_est_sys_name',
                CUSTOMER: 'custrecord_raw_est_customer',
                PROJECT: 'custrecord_raw_est_project',
                OPPORTUNITY: 'custrecord_raw_est_opport',
                LABOUR_PLAN: 'custrecord_raw_est_labour_plan',
                MISC_COST: 'custrecord_raw_est_misc_cost',
                SUBHEADERS: 'custrecord_raw_est_sublist_details',
                FILE: 'custrecord_raw_est_file',
                FOLDER_ID: '14783',
                FILE_PATH: '/SuiteScripts/TPC/RAW JSON Files/'
            }
        },
        AUTO_GEN: {
            RECORD_TYPE: 'customrecord_div_tpc_auto_gen_no',
            FIELDS: {
                ID: 'name',
                PREFIX: 'custrecord_div_tpc_prefix',
                SUFFIX: 'custrecord_div_tpc_suffix',
                INITIAL_NUM: 'custrecord_div_tpc_initial_no',
                CURRENT_NUM: 'custrecord_div_tpc_curr_num',
                ROOM_INITIAL_NUM: 'custrecord_div_tpc_room_initial_no',
                ROOM_CURRENT_NUM: 'custrecord_div_tpc_room_curr_num'
            }
        },
        NSID_REC: {
            RECORD_TYPE: 'customrecord_div_tpc_system_id',
            FIELDS: {
                ID: 'custrecord_div_tpc_netsuite_rec_id',
                NAME: 'custrecord_div_tpc_system_name',
                CUSTOMER: 'custrecord_div_tpc_customer_id',
                PROJECT: 'custrecord_div_tpc_project_id',
                OPPORTUNITY: 'custrecord_div_tpc_opp_id',
                TASK_ID: 'custrecord_div_tpc_task_id',
                PROCESSED_CB: 'custrecord_div_tpc_pocess_cb',
                ROLL_CB: 'custrecord_div_tpc_rollout_proj'
            }
        },
        PROCESSING_QUEUE: {
            RECORD_TYPE: 'customrecord_ks_processing_queue',
            FIELDS: {
                ID: 'custrecord_ks_systemid',
                ESTIMATES: 'custrecord_ks_estiamtes',
                SOV_ESTIMATE: 'custrecord_div_sov_estimate',
                NSID: 'custrecord_div_nsid_rec',
                TASK_ID: 'custrecord_ks_taskid',
                BODY_DATA: 'custrecord_ks_bodydata',
                LINES_DATA: 'custrecord_ks_linesdata',
                FOLDER_ID: '14785',//SB1
                COMPLETED_CB: 'custrecord_ks_completed',
                ERROR_LOGS: 'custrecord_ks_execution_logs'
            }
        },
        PREFERENCES: {
            RECORD_TYPE: 'customrecord_div_tpc_preferences',
            FIELDS: {
                NAME: 'name',
                LOCATION: 'custrecord_pref_location',
                AUTO_GEN: 'custrecord_pref_auto_gen_no',
                LABOUR_ITEM: 'custrecord_pref_labor_item',
                MISC_ITEM: 'custrecord_pref_misc_item',
                ROOMS_ITEM: 'custrecord_pref_rooms_item',
                FREIGHT_ITEM: 'custrecord_pref_freight_item',
                TRAVEL_ITEM: 'custrecord_pref_travel_item',
                LABOUR_NT_ITEM: 'custrecord_pref_labor_nt_item',
                MISC_NT_ITEM: 'custrecord_pref_misc_nt_item',
                ROOMS_NT_ITEM: 'custrecord_pref_rooms_nt_item',
                FREIGHT_NT_ITEM: 'custrecord_pref_freight_nt_item',
                TRAVEL_NT_ITEM: 'custrecord_pref_travel_nt_item',
                LABOUR_SO_TYPE: 'custrecord_pref_labor_so_type',
                MISC_SO_TYPE: 'custrecord_pref_misc_so_type',
                SOV_SO_TYPE: 'custrecord_pref_sov_so_type',
                TRAVEL_SO_TYPE: 'custrecord_pref_travel_so_type',
                FREIGHT_SO_TYPE: 'custrecord_pref_freight_so_type',
                LABOUR_NT_SO_TYPE: 'custrecord_pref_labor_nt_so_type',
                MISC_NT_SO_TYPE: 'custrecord_pref_misc_nt_so_type',
                SOV_NT_SO_TYPE: 'custrecord_pref_rooms_nt_so_type',
                TRAVEL_NT_SO_TYPE: 'custrecord_pref_travel_nt_so_type',
                FREIGHT_NT_SO_TYPE: 'custrecord_pref_freight_nt_so_type',
                LABOR_WC: 'custrecord_pref_labor_wc',
                MISC_WC: 'custrecord_pref_misc_wc',
                ROOMS_WC: 'custrecord_pref_rooms_wc',
                FREIGHT_WC: 'custrecord_pref_freight_wc',
                TRAVEL_WC: 'custrecord_pref_travel_wc',
            }
        },
        CSV_IMPORT: {
            TITLE: 'CSV Import',
            FIELDS: {
                TYPE: 'custpage_type',
                FILE: 'custpage_csv_import_file',
                APPEND_NEW: 'custpage_append_new',
                APPEND_EXISTING: 'custpage_append_existing',
                REPLACE_EXISTING: 'custpage_replace_existing',
                REPLACE_ALL: 'custpage_replace_all'
            },
            BUTTONS: {
                SUBMIT: {
                    LABEL: 'Upload'
                }
            },
            URL: '/app/site/hosting/scriptlet.nl?script=5998&deploy=1',
            CLIENT_SCRIPT_PATH: '/SuiteScripts/TPC/ClientScript/div_tpc_csv_import_cs.js',
        },
        CSV_EXPORT_FOLDER: '9361',
        COPY_NSID: {
            TITLE: 'Copy NetSuite ID',
            FIELDS: {
                CUSTOMER: 'custpage_customer',
                NSID: 'custpage_netsuite_id'
            },
            BUTTONS: {
                SUBMIT: {
                    LABEL: 'Copy'
                }
            },
            URL: '/app/site/hosting/scriptlet.nl?script=7279&deploy=1'
        },
        GROUPS_DISPLAY: {
            TITLE: 'Groups Hide and UnHide',
            FIELDS: {
                DESIGN_NOTES_CB: 'custpage_design_notes_cb',
                PRICING_CB: 'custpage_pricing_cb',
                ITEM_DETAILS_CB: 'custpage_item_details_cb',
                PROJECT_INFO_CB: 'custpage_product_info_cb',
                SUPPLY_CHAIN_CB: 'custpage_supply_chain_cb',
                PROJECT_EXE_CB: 'custpage_project_execution_cb',
                TECH_INFO_CB: 'custpage_tech_info_cb',
                USER_FIELDS_CB: 'custpage_user_fields_cb',
                LOGS_CB: 'custpage_log_cb',
            },
            BUTTONS: {
                SUBMIT: {
                    LABEL: 'Submit'
                }
            },
            URL: '/app/site/hosting/scriptlet.nl?script=7533&deploy=1'
        },
        ROOM_ACTIONS: {
            TITLE: 'Perform Room Operations',
            FIELDS: {
                TEMPLATE: 'custpage_sub_header_name',
                BLANK: 'custpage_blank_sub_header',
                COPY: 'custpage_copy_sub_header',
                NEW: 'custpage_new_sub_header_name',
                EXISTING: 'custpage_existing_sub_header_list',
                TEMP_CB: 'custpage_sub_header_template_cb',
                BLANK_CB: 'custpage_blank_sub_header_cb',
                COPY_CB: 'custpage_copy_sub_header_cb',
                RENAME_CB: 'custpage_rename_sub_header_cb',
                DELETE_CB: 'custpage_delete_sub_header_cb',
            },
            BUTTONS: {
                SUBMIT: {
                    LABEL: 'Submit'
                }
            },
            CLIENT_SCRIPT_PATH: '/SuiteScripts/TPC/ClientScript/div_tpc_room_actions_cs.js',
            URL: '/app/site/hosting/scriptlet.nl?script=7532&deploy=1'
        },
        CHANGE_ORDER: {
            URL: '/app/common/custom/custrecordentry.nl?rectype=3176'
        },
        LISTS: {
            ORDER_TYPE: 'customlist_div_order_type',
            FLAG: 'customlist_div_tpc_flag'
        },
        SCRIPTS: {
            ESTIMATOR: {
                SCRIPT_ID: 'customscript_div_tpc_est_tool',
                SCRIPT_DEPLOYMENT: 'customdeploy_div_tpc_est_tool'
            },
            CSV_IMPORT: {
                SCRIPT_ID: 'customscript_div_tpc_import_csv',
                SCRIPT_DEPLOYMENT: 'customdeploy_div_tpc_import_csv'
            },
            ESTIMATOR_PDF: {
                SCRIPT_ID: 'customscript_div_tpc_est_print',
                SCRIPT_DEPLOYMENT: 'customdeploy_div_tpc_est_print'
            },
        }
    }
});