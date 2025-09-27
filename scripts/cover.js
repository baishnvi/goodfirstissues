// Access previously checked dropdown items from storage
const checked_proglangs_session = sessionStorage.getItem('checked_proglangs');
const checked_labels_session = sessionStorage.getItem('checked_labels');
const checked_repo_names_session = sessionStorage.getItem('checked_repo_names');
let minimum_repo_stars_session = sessionStorage.getItem('minimum_repo_stars');
const entries_per_page = 10;

function killSpinner() {
    const spinner = document.getElementById("loading");
    if (spinner && spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
    }
}

function showTable() {
    const mainRow = document.getElementById("mainRow");
    if (mainRow) {
        mainRow.classList.add('visible');
    }
}

function renderFilteredList(filteredIssueList, entries_per_page) {
    const total_num_pages = Math.ceil(filteredIssueList.length / entries_per_page);

    $('#pagination').empty();
    $('#pagination').removeData("twbs-pagination");
    $('#pagination').unbind("page");

    let number_of_visible_pages = $(window).width() <= 440 ? 2 : 5;

    const issues_table = document.getElementById("issues_table");

    if (total_num_pages > 0) {
        $('#pagination').twbsPagination({
            totalPages: total_num_pages,
            visiblePages: number_of_visible_pages,
            hideOnlyOnePage: true,
            onPageClick: function (event, page) {
                const page_index = page - 1; // Variable page starts from 1
                issues_table.innerHTML = ""; // Clear the table page

                for (let i = page_index * entries_per_page; i < (page_index + 1) * entries_per_page; i++) {
                    if (i >= filteredIssueList.length) break;
                    $("#issues_table").append(filteredIssueList[i]);

                    // Insert ad after every 5th item, not first
                    if ((i + 1) % 5 === 0) {
                        const ad_item = document.createElement("li");
                        ad_item.className = "issue-list-group-item clearfix";
                        ad_item.innerHTML = `
                            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
                            <ins class="adsbygoogle"
                                 style="display:block"
                                 data-ad-format="fluid"
                                 data-ad-layout-key="-fb+5w+4e-db+86"
                                 data-ad-client="ca-pub-1130124846637992"
                                 data-ad-slot="5362633000">
                            </ins>
                            <script>
                                 (adsbygoogle = window.adsbygoogle || []).push({});
                            </script>
                        `;
                        $("#issues_table").append(ad_item);
                    }
                }

                $('[data-toggle="tooltip"]').tooltip();

                // Jump back to top
                $("html, body").animate({ scrollTop: 0 }, 1);
            }
        });
    } else {
        issues_table.appendChild(document.createTextNode(
            "Oops! Seems like there is no issue to show! Refresh to try again."
        ));
    }

    $("select").selectpicker("refresh");
}

function main(data_list) {
    const issues_list = [];
    const all_prog_langs = [];
    const all_types_of_issues = [];
    const all_repo_names = [];

    for (let i = 0; i < data_list.length; i++) {
        if (!data_list[i].Issue.issue_url) continue;

        const issue = new Issue(data_list[i]);
        issues_list.push(issue);

        const issue_prog_langs = _.uniq(issue.getRepoProgLangs());
        issue_prog_langs.forEach(pl => all_prog_langs.push(_.upperFirst(pl)));

        const issue_labels = _.uniq(issue.getIssueLabels());
        issue_labels.forEach(l => all_types_of_issues.push(l.toLowerCase()));

        all_repo_names.push(issue.getIssueRepoName());
    }

    const sorted_issues_html_list = _.map(issues_list, o => createListGroupItemForIssue(o));

    // Create checkboxes
    const sorted_prog_lang_counter = returnSortedCounterForCheckBox(all_prog_langs);
    createCheckBoxFromCounter(sorted_prog_lang_counter, "Programming Language", "proglang");

    const sorted_issue_counter = returnSortedCounterForCheckBox(all_types_of_issues);
    createCheckBoxFromCounter(sorted_issue_counter, "Issue Label", "label");

    const sorted_repo_name_counter = returnSortedCounterForCheckBox(all_repo_names);
    createCheckBoxFromCounter(sorted_repo_name_counter, "Repository", "repo");

    createClassifiedsUnderCheckbox();    
    createInputFormRepoStars("Minimum Number of Stars", "repostars");

    let [checked_proglangs, checked_labels, checked_repo_names, minimum_repo_stars] = setChecked(
        checked_proglangs_session, 
        checked_labels_session, 
        checked_repo_names_session, 
        minimum_repo_stars_session
    );

    $("input").change(function() {
        const inputform_id = $(this).attr("id");

        if (inputform_id === "inputformrepostars") { 
            const value = document.getElementById(inputform_id).value;
            minimum_repo_stars = Number(value) > 0 ? Number(value) : 0;
            sessionStorage.setItem('minimum_repo_stars', minimum_repo_stars);
        }

        filter(issues_list, sorted_issues_html_list, checked_proglangs, checked_labels, checked_repo_names, minimum_repo_stars);
    });

    $("select").change(function() {
        const dropdown_id = $(this).attr("id");
        let options = [...document.getElementById(dropdown_id).querySelectorAll("option")].map(item => item.getAttribute("title"));

        const dropdown_menu_items = document.getElementById(dropdown_id).nextSibling.nextSibling;
        const all_selected_items = dropdown_menu_items.querySelectorAll("li.selected");
        const selected_ids = _.map(all_selected_items, item => item.getElementsByTagName("a")[0].getAttribute("id"));

        if(dropdown_id === 'dropdownproglang') {
            const checked_proglangs_items = [...selected_ids];
            sessionStorage.setItem('checked_proglangs', checked_proglangs_items);
        } else if(dropdown_id === 'dropdownlabel') {
            const checked_labels_items = [...selected_ids];
            sessionStorage.setItem('checked_labels', checked_labels_items);
        } else if(dropdown_id === 'dropdownrepo') {
            const checked_repo_names_items = [...selected_ids];
            sessionStorage.setItem('checked_repo_names', checked_repo_names_items);
        }

        const checked_items = _.map(selected_ids, item => {
            const idx_selected = _.toInteger(_.split(item, "-").pop());
            return options[idx_selected];
        });

        if (dropdown_id === "dropdownproglang") checked_proglangs = checked_items.slice();
        else if (dropdown_id === "dropdownlabel") checked_labels = checked_items.slice();
        else checked_repo_names = checked_items.slice();

        filter(issues_list, sorted_issues_html_list, checked_proglangs, checked_labels, checked_repo_names, minimum_repo_stars);
    });

    $.when(renderFilteredList(sorted_issues_html_list, entries_per_page)).done(function() {
        killSpinner();
        showTable();
    });

    $(document).ready(function(){
        $('[data-toggle="tooltip"]').tooltip();
    });

    $(document).on('click', '.dropdown-menu', e => e.stopPropagation());
}

function filter(issues_list, sorted_issues_html_list, checked_proglangs, checked_labels, checked_repo_names, minimum_repo_stars) { 
    const minStars = Number(minimum_repo_stars) || 0;

    if (_.isEmpty(checked_proglangs) && _.isEmpty(checked_labels) && _.isEmpty(checked_repo_names) && minStars === 0) {
        renderFilteredList(sorted_issues_html_list, entries_per_page);
    } else {
        const filtered_list = [];

        checked_proglangs = _.map(checked_proglangs, i => i.toLowerCase());
        checked_labels = _.map(checked_labels, i => i.toLowerCase());

        for (let j = 0; j < issues_list.length; j++) {
            const issue_item = issues_list[j];

            if (issue_item.getRepoStars() < minStars) continue;

            const repo_langs = _.map(issue_item.getRepoProgLangs(), l => l.toLowerCase());
            const issues_labels = _.map(issue_item.getIssueLabels(), l => l.toLowerCase());
            const issue_repo = issue_item.getIssueRepoName();

            const intersection_prog_langs = _.intersection(checked_proglangs, repo_langs);
            const intersection_labels = _.intersection(checked_labels, issues_labels);
            const intersection_repos = _.intersection(checked_repo_names, [issue_repo]);

            const num_intersections = _.concat(intersection_prog_langs, intersection_labels, intersection_repos).length;

            if (num_intersections > 0 || (_.isEmpty(checked_proglangs) && _.isEmpty(checked_labels) && _.isEmpty(checked_repo_names))) {
                filtered_list.push({ issue: issue_item, num_intersections });
            }
        }

        const sorted_filtered_list = _.orderBy(
            filtered_list,
            [o => o.num_intersections, o => o.issue.getCreatedAt()],
            ['desc', 'desc']
        );

        const sorted_issue_list = _.map(sorted_filtered_list, o => createListGroupItemForIssue(o.issue));
        renderFilteredList(sorted_issue_list, entries_per_page);
    }
}

// Fetch JSON data from Github
let data_list = [];
$.getJSON("https://raw.githubusercontent.com/darensin01/goodfirstissues/master/backend/data.json", function(data) {
    data_list = data;
    data_list.sort((a, b) => b.Issue.issue_createdAt - a.Issue.issue_createdAt);
}).fail(function() {
    renderFilteredList([], 0);
    killSpinner();
    showTable();
}).done(function() {
    main(data_list);
});
